import { redirect } from 'next/navigation';
// Native WebView intercepts this navigation; ordinary browsers return home.
export default function CloseContact() {
  redirect('/');
}
