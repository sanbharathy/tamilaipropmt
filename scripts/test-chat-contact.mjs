import assert from 'node:assert/strict';
import { randomUUID, createHash, createHmac, createDecipheriv } from 'node:crypto';
import postgres from 'postgres';
import sharp from 'sharp';
process.loadEnvFile('.env.chat.local');
process.loadEnvFile('.env.contact.test.local');
const base = process.env.CHAT_TEST_URL || 'http://localhost:3022';
const sql = postgres(process.env.CHAT_DATABASE_URL, { ssl:'require', prepare:false, max:1 });
const hash = value => createHash('sha256').update(value).digest('hex');
const ownerSecret = createHmac('sha256',process.env.TAIE_CONTACT_OWNER_KEY).update('taie-owner-session').digest('base64url');
const network = 'taie-test-'+randomUUID(), people = new Set(), rooms = new Set(), jars = [];
const owner = new Map(), a = new Map(), b = new Map(); jars.push(owner,a,b);
async function call(jar, body, route='/api/chat/contact', origin=base) {
  const response = await fetch(base+route, { signal:AbortSignal.timeout(15000), method:body?'POST':'GET', headers:{ origin, 'Content-Type':'application/json', 'x-vercel-forwarded-for':network, cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ') }, ...(body?{body:JSON.stringify(body)}:{}) });
  for (const header of response.headers.getSetCookie()) { const pair=header.split(';')[0], i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1)); }
  return { status:response.status, data:await response.json() };
}
async function ok(jar,body,route) { const result=await call(jar,body,route);assert.equal(result.status,200,JSON.stringify(result.data));if(result.data.roomId)rooms.add(result.data.roomId);return result.data; }
async function remember(jar,key) { const [row]=await sql`select id from tamil_chat.sessions where token_hash=${hash(jar.get(key))}`;if(row)people.add(row.id);return row?.id; }
try {
  assert.equal((await call(owner,{action:'owner-login',key:'incorrect',accepted:true})).status,401);
  await ok(owner,{action:'owner-login',key:process.env.TAIE_CONTACT_OWNER_KEY,accepted:true});
  const [host]=await sql`select id from tamil_chat.sessions where token_hash=${hash(owner.get('tamilai_chat'))}`;people.add(host.id);
  assert.equal((await call(a,{action:'start',name:'TestVisitorA',accepted:false})).status,400);
  const first=await ok(a,{action:'start',name:'TestVisitorA',accepted:true});const aid=await remember(a,'taie_contact');
  const second=await ok(b,{action:'start',name:'TestVisitorB',accepted:true});await remember(b,'taie_contact');
  assert.notEqual(first.roomId,second.roomId);
  console.log('Visitor creation passed; testing concurrent reopen.');
  const parallel=await Promise.all(Array.from({length:4},()=>ok(a,{action:'open'})));
  assert.ok(parallel.every(x=>x.roomId===first.roomId),'parallel opens reuse one active room');
  const mine=await ok(a);assert.equal(mine.rooms.length,1);assert.equal(mine.rooms[0].id,first.roomId);
  assert.equal((await call(b,undefined,`/api/chat?room=${first.roomId}`)).status,404,'another visitor cannot read the chat');
  assert.equal((await call(b,{action:'open',roomId:first.roomId})).data.roomId,second.roomId,'visitor cannot choose another room');
  assert.equal((await call(a,{action:'owner-login',key:'wrong',accepted:true})).status,401);
  assert.equal((await call(a,{action:'open'},undefined,'https://untrusted.example')).status,403);
  const link=await ok(a,{action:'return-link'});assert.ok(link.link.includes('#return='));
  const restored=new Map();jars.push(restored);await ok(restored,{action:'restore',secret:new URL(link.link).hash.slice('#return='.length)});
  assert.equal((await ok(restored,{action:'open'})).roomId,first.roomId);
  const image=await sharp({create:{width:8,height:8,channels:3,background:'#ed6344'}}).webp().toBuffer();
  await sql`insert into tamil_chat.messages(room_id,sender_id,client_id,body,image_data,image_type) values(${first.roomId},${aid},${randomUUID()},'Synthetic test picture',${image},'image/webp')`;
  await ok(owner,{action:'destroy',roomId:first.roomId},'/api/chat');
  const [archive]=await sql`select snapshot,expires_at-ended_at=interval '30 days' as retained from tamil_chat.archives where room_id=${first.roomId}`;
  assert.ok(archive?.retained,'ended chat has a 30-day archive');
  if(archive.snapshot)assert.ok(archive.snapshot.messages.some(m=>m.image),'image is captured before removal');
  let rendered;
  for(let i=0;i<40;i++){
    [rendered]=await sql`select pdf_data from tamil_chat.archives where room_id=${first.roomId} and ready_at is not null`;
    if(rendered)break;
    await new Promise(r=>setTimeout(r,200));
  }
  assert.ok(rendered?.pdf_data,'PDF generated');
  const data=rendered.pdf_data, archiveKey=createHmac('sha256',process.env.CHAT_RATE_SALT).update('tamilaiprompt-chat-archive-v1').digest();
  const decipher=createDecipheriv('aes-256-gcm',archiveKey,data.subarray(0,12));decipher.setAAD(Buffer.from(first.roomId));decipher.setAuthTag(data.subarray(-16));
  const pdf=Buffer.concat([decipher.update(data.subarray(12,-16)),decipher.final()]);
  assert.equal(pdf.subarray(0,4).toString(),'%PDF');assert.ok(pdf.includes(Buffer.from('/Subtype /Image')),'security PDF contains synthetic picture');
  const [live]=await sql`select image_data from tamil_chat.messages where room_id=${first.roomId}`;assert.equal(live.image_data,null);
  const reopened=await ok(restored,{action:'open'});assert.notEqual(reopened.roomId,first.roomId,'permanent return link starts fresh after destroy');
  await sql`update tamil_chat.rooms set expires_at=now()-interval '1 second' where id=${reopened.roomId}`;
  const afterExpiry=await ok(restored,{action:'open'});assert.notEqual(afterExpiry.roomId,reopened.roomId);
  const [expired]=await sql`select expires_at-ended_at=interval '30 days' as retained from tamil_chat.archives where room_id=${reopened.roomId}`;assert.ok(expired?.retained);
  assert.equal((await ok(owner)).rooms.length,2,'owner sees separate active visitors');
  const oldOwner = new Map(owner);
  await ok(owner,{action:'owner-logout'});
  assert.equal((await call(oldOwner,undefined,`/api/chat?room=${afterExpiry.roomId}`)).data.me,null,'old owner chat cookie is invalid after logout');assert.equal((await ok(owner)).me,null,'owner logout invalidates inbox access');
  console.log('PASS: owner authentication, visitor isolation, concurrent open, permanent return links, destroy/expiry, image capture, and 30-day archive retention.');
} finally {
  for(const id of rooms){await sql`delete from tamil_chat.rooms where id=${id}`;await sql`delete from tamil_chat.archives where room_id=${id}`;}
  for(const id of people){await sql`delete from tamil_chat.limits where key=${'taie-contact:'+id} or key=${'contact-rooms:'+id}`;await sql`delete from tamil_chat.sessions where id=${id}`;}
  for(const jar of jars){const secret=jar.get('taie_contact_owner');if(secret)await sql`delete from tamil_chat.limits where key like ${'taie-owner:%:'+hash(secret)}`;}
  const hmac=createHmac('sha256',process.env.CHAT_RATE_SALT).update(network).digest('hex');
  await sql`delete from tamil_chat.limits where key like ${'%:'+hmac}`;
  await sql.end();
}
