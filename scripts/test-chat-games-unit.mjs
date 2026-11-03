import assert from 'node:assert/strict';
import { newChatGame, advanceGame, gameChoices } from '../lib/chat-games.ts';
import { gameMessage, readGameMessage } from '../lib/chat-game-server.ts';
process.env.CHAT_RATE_SALT = 'isolated-game-engine-test-key';
const players = [
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
  ],
  room = '00000000-0000-4000-8000-000000000003';
const start = (kind) =>
  advanceGame(
    newChatGame('game-test', room, kind, players),
    players[1],
    'accept',
  );
const move = (game, cell) =>
  advanceGame(game, players[game.turn], 'move', cell);
let game = start('tic-tac-toe');
assert.throws(() => advanceGame(game, players[1], 'move', 0));
const original = JSON.stringify(game);
assert.throws(() => advanceGame(game, 'outsider', 'move', 0));
assert.equal(JSON.stringify(game), original);
for (const cell of [0, 3, 1, 4, 2]) game = move(game, cell);
assert.equal(game.winner, 0);
assert.equal(game.phase, 'finished');
assert.throws(() => move(game, 8));
game = start('tic-tac-toe');
for (const cell of [0, 1, 2, 4, 3, 5, 7, 6, 8]) game = move(game, cell);
assert.equal(game.winner, 'draw');
game = move(start('tic-tac-toe'), 0);
assert.throws(() => move(game, 0));
for (const columns of [
  [0, 1, 0, 1, 0, 1, 0],
  [0, 6, 1, 6, 2, 5, 3],
  [0, 1, 1, 2, 4, 2, 2, 3, 4, 3, 4, 3, 3],
]) {
  game = start('connect-four');
  for (const column of columns) game = move(game, column);
  assert.equal(game.winner, 0);
}
game = start('connect-four');
for (let i = 0; i < 6; i++) game = move(game, 0);
assert.throws(() => move(game, 0));
game = start('dots-boxes');
for (let edge = 0; edge < 12; edge++) {
  const before = game.turn;
  game = move(game, edge);
  if (edge === 7)
    assert.equal(game.turn, before, 'Claiming a box grants another turn');
}
assert.equal(game.phase, 'finished');
assert.equal(game.winner, 'draw');
assert.deepEqual(game.boxes, [1, 1, 0, 0]);
game = start('take-21');
for (let i = 0; i < 7; i++) game = move(game, 3);
assert.equal(game.remaining, 0);
assert.equal(game.winner, 0);
game = start('take-21');
assert.throws(() => move(game, 4));
game = advanceGame(game, players[0], 'resign');
assert.equal(game.winner, 1);
const pending = newChatGame('pending', room, 'tic-tac-toe', players);
assert.throws(() => advanceGame(pending, players[0], 'accept'));
assert.equal(advanceGame(pending, players[1], 'decline').phase, 'declined');
for (const choice of gameChoices) {
  const state = start(choice.kind),
    encoded = gameMessage(state);
  assert.ok(encoded.length <= 1200);
  assert.equal(readGameMessage(encoded, room, players[1]).kind, choice.kind);
  assert.equal(readGameMessage(encoded, room, players[0]), null);
  assert.equal(readGameMessage(encoded, 'another-room'), null);
  assert.equal(
    readGameMessage(encoded.replace('playing', 'finished'), room),
    null,
  );
}
console.log(
  'PASS: all four game engines, wins/draws, diagonal lines, full columns, box extra turns, invalid moves, resignation and signed-state integrity.',
);
