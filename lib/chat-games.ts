export const gameChoices = [
  {
    kind: 'tic-tac-toe',
    name: 'Tic-tac-toe',
    icon: '✕',
    description: 'Three in a row. A quick classic.',
    rules: 'Take turns placing X and O. Make a line of three to win.',
  },
  {
    kind: 'connect-four',
    name: 'Four in a row',
    icon: '●',
    description: 'Drop a piece. Connect four.',
    rules:
      'Choose a column to drop your piece. Connect four horizontally, vertically or diagonally.',
  },
  {
    kind: 'dots-boxes',
    name: 'Dots & boxes',
    icon: '□',
    description: 'Join the dots and claim boxes.',
    rules:
      'Draw one edge per turn. Complete a box to claim it and take another turn. Most boxes wins.',
  },
  {
    kind: 'take-21',
    name: 'Take 21',
    icon: '21',
    description: 'Take 1, 2 or 3. Last one wins.',
    rules:
      'Start with 21 counters. Take 1, 2 or 3 on your turn. Whoever takes the last counter wins.',
  },
] as const;
export type GameKind = (typeof gameChoices)[number]['kind'];
export type ChatGame = {
  id: string;
  roomId: string;
  kind: GameKind;
  players: [string, string];
  phase: 'invited' | 'playing' | 'finished' | 'declined';
  turn: 0 | 1;
  board: number[];
  boxes: number[];
  remaining: number;
  winner: 0 | 1 | 'draw' | null;
  revision: number;
  actor: 0 | 1;
  lastAction: 'invite' | 'accept' | 'move' | 'decline' | 'resign';
};
export function isGameKind(value: unknown): value is GameKind {
  return gameChoices.some((game) => game.kind === value);
}
export function newChatGame(
  id: string,
  roomId: string,
  kind: GameKind,
  players: [string, string],
): ChatGame {
  return {
    id,
    roomId,
    kind,
    players,
    phase: 'invited',
    turn: 0,
    board: Array(
      kind === 'tic-tac-toe'
        ? 9
        : kind === 'connect-four'
          ? 42
          : kind === 'dots-boxes'
            ? 12
            : 0,
    ).fill(-1),
    boxes: kind === 'dots-boxes' ? Array(4).fill(-1) : [],
    remaining: 21,
    winner: null,
    revision: 0,
    actor: 0,
    lastAction: 'invite',
  };
}
export class GameRuleError extends Error {}
function requireRule(condition: unknown, message: string): asserts condition {
  if (!condition) throw new GameRuleError(message);
}
export function advanceGame(
  previous: ChatGame,
  player: string,
  action: 'accept' | 'decline' | 'resign' | 'move',
  move?: unknown,
): ChatGame {
  const actor = previous.players.indexOf(player);
  requireRule(actor === 0 || actor === 1, 'Only the two players can play.');
  requireRule(
    previous.phase === 'invited' || previous.phase === 'playing',
    'This game is over. Choose a new game.',
  );
  const game: ChatGame = {
    ...previous,
    board: [...previous.board],
    boxes: [...previous.boxes],
    revision: previous.revision + 1,
    actor,
    lastAction: action,
  };
  if (action === 'accept' || action === 'decline') {
    requireRule(
      game.phase === 'invited' && actor === 1,
      'Only your invited friend can respond.',
    );
    game.phase = action === 'accept' ? 'playing' : 'declined';
    return game;
  }
  if (action === 'resign') {
    requireRule(
      game.phase === 'playing' || actor === 0,
      'Only the inviter can cancel this invitation.',
    );
    game.phase = game.phase === 'invited' ? 'declined' : 'finished';
    game.winner = game.phase === 'finished' ? (actor === 0 ? 1 : 0) : null;
    return game;
  }
  requireRule(
    game.phase === 'playing',
    'Your friend must accept before playing.',
  );
  requireRule(game.turn === actor, 'Wait for your turn.');
  requireRule(
    typeof move === 'number' && Number.isInteger(move),
    'Choose a valid move.',
  );
  const finish = (winner: 0 | 1 | 'draw') => {
    game.phase = 'finished';
    game.winner = winner;
  };
  let extraTurn = false;
  if (game.kind === 'take-21') {
    requireRule(
      move >= 1 && move <= 3 && move <= game.remaining,
      'Take 1, 2 or 3 counters.',
    );
    game.remaining -= move;
    if (game.remaining === 0) finish(actor);
  } else if (game.kind === 'dots-boxes') {
    requireRule(
      move >= 0 && move < 12 && game.board[move] === -1,
      'Choose an empty edge.',
    );
    game.board[move] = actor;
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 2; c++) {
        const box = r * 2 + c,
          edges = [
            r * 2 + c,
            (r + 1) * 2 + c,
            6 + r * 3 + c,
            6 + r * 3 + c + 1,
          ];
        if (
          game.boxes[box] === -1 &&
          edges.every((edge) => game.board[edge] !== -1)
        ) {
          game.boxes[box] = actor;
          extraTurn = true;
        }
      }
    if (game.boxes.every((box) => box !== -1)) {
      const a = game.boxes.filter((box) => box === 0).length,
        b = 4 - a;
      finish(a === b ? 'draw' : a > b ? 0 : 1);
    }
  } else {
    let cell = move,
      width = 3,
      height = 3,
      target = 3;
    if (game.kind === 'connect-four') {
      width = 7;
      height = 6;
      target = 4;
      requireRule(move >= 0 && move < 7, 'Choose a column.');
      cell = -1;
      for (let row = 5; row >= 0; row--)
        if (game.board[row * 7 + move] === -1) {
          cell = row * 7 + move;
          break;
        }
      requireRule(cell !== -1, 'That column is full.');
    } else
      requireRule(
        cell >= 0 && cell < 9 && game.board[cell] === -1,
        'Choose an empty square.',
      );
    game.board[cell] = actor;
    const row = Math.floor(cell / width),
      col = cell % width;
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ]) {
      let count = 1;
      for (const direction of [-1, 1])
        for (let step = 1; step < target; step++) {
          const r = row + dr * step * direction,
            c = col + dc * step * direction;
          if (
            r < 0 ||
            r >= height ||
            c < 0 ||
            c >= width ||
            game.board[r * width + c] !== actor
          )
            break;
          count++;
        }
      if (count >= target) finish(actor);
    }
    if (game.phase === 'playing' && game.board.every((value) => value !== -1))
      finish('draw');
  }
  if (game.phase === 'playing' && !extraTurn) game.turn = actor === 0 ? 1 : 0;
  return game;
}
