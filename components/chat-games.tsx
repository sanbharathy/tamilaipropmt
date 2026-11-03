'use client';
import { useState } from 'react';
import { Gamepad2, X, ArrowLeft } from 'lucide-react';
import { gameChoices, type ChatGame, type GameKind } from '@/lib/chat-games';

export function ChatGames({
  roomId,
  game,
  meId,
  peerName,
  connected,
  onRefresh,
  onClose,
}: {
  roomId: string;
  game: ChatGame | null;
  meId: string;
  peerName: string;
  connected: boolean;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [choosing, setChoosing] = useState(false);
  const choice = gameChoices.find((item) => item.kind === game?.kind),
    player = game?.players.indexOf(meId) ?? -1;
  const myTurn = !!game && game.phase === 'playing' && game.turn === player,
    canMove = myTurn && connected && !busy;
  const name = (index: number) => (index === player ? 'You' : peerName);
  async function act(
    action: string,
    extra: { kind?: GameKind; move?: number } = {},
  ) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/chat/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          action,
          ...extra,
          gameId: game?.id,
          expectedRevision: game?.revision,
          clientId: crypto.randomUUID(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) await onRefresh();
        throw new Error(data.error ?? 'Please retry.');
      }
      setChoosing(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setBusy(false);
    }
  }
  const play = (move: number) => void act('move', { move });
  const status = !game
    ? 'Choose a quick game'
    : game.phase === 'invited'
      ? player === 0
        ? `Waiting for ${peerName} to accept`
        : `${peerName} invited you to play`
      : game.phase === 'declined'
        ? 'Invitation closed'
        : game.phase === 'finished'
          ? game.winner === 'draw'
            ? 'It’s a draw'
            : game.lastAction === 'resign'
              ? `${name(game.actor)} left the game`
              : `${name(game.winner!)} won!`
          : myTurn
            ? 'Your turn'
            : `${peerName}’s turn`;
  return (
    <section
      aria-label="Chat games"
      className="shrink-0 border-t border-[#dbe8de] bg-[#f7fbf7]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Gamepad2 size={17} className="shrink-0 text-[#23725b]" />
          <div className="min-w-0">
            <h2 className="truncate text-xs font-bold">
              {choosing ? 'Choose a game' : (choice?.name ?? 'Play together')}
            </h2>
            <p
              aria-live="polite"
              className="truncate text-[10px] text-[#607767]"
            >
              {status}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Minimize game panel"
          className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-[#e5efe7]"
        >
          <X size={16} />
        </button>
      </div>
      <div className="max-h-[35dvh] overflow-y-auto px-4 pb-3">
        {!game || choosing || game.phase === 'declined' ? (
          <>
            {choosing && (
              <button
                type="button"
                onClick={() => setChoosing(false)}
                className="mb-2 inline-flex min-h-8 items-center gap-1 text-xs font-semibold"
              >
                <ArrowLeft size={12} />
                Back to result
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              {gameChoices.map((item) => (
                <button
                  key={item.kind}
                  type="button"
                  disabled={busy || !connected}
                  onClick={() => void act('start', { kind: item.kind })}
                  className="flex min-h-20 items-center gap-3 rounded-2xl border border-[#dbe8dd] bg-white px-3 py-3 text-left hover:border-[#76ac91] disabled:opacity-40"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e7f3e9] text-lg font-bold text-[#287059]"
                  >
                    {item.icon}
                  </span>
                  <span>
                    <span className="block text-xs font-bold">{item.name}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-[#607767]">
                      {item.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : game.phase === 'invited' ? (
          <div className="rounded-2xl border border-[#dce9de] bg-white p-4">
            <p className="text-xs leading-6">{choice?.rules}</p>
            <div className="mt-3 flex gap-2">
              {player === 1 ? (
                <>
                  <button
                    type="button"
                    disabled={busy || !connected}
                    onClick={() => void act('accept')}
                    className="min-h-10 rounded-xl bg-[#23725b] px-5 text-xs font-bold text-white disabled:opacity-40"
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    disabled={busy || !connected}
                    onClick={() => void act('decline')}
                    className="min-h-10 rounded-xl border px-4 text-xs font-semibold"
                  >
                    Not now
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={busy || !connected}
                  onClick={() => void act('resign')}
                  className="min-h-10 rounded-xl border px-4 text-xs font-semibold"
                >
                  Cancel invitation
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2 flex justify-center gap-4 text-[10px] font-bold">
              <span className="text-[#156cb0]">● {name(0)}</span>
              <span className="text-[#ad512d]">● {name(1)}</span>
            </div>
            {game.kind === 'tic-tac-toe' && (
              <div
                className="mx-auto grid max-w-52 grid-cols-3 gap-1.5"
                aria-label="Tic-tac-toe board"
              >
                {game.board.map((cell, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Square ${index + 1}${cell === -1 ? ', empty' : cell === 0 ? ', X' : ', O'}`}
                    disabled={!canMove || cell !== -1}
                    onClick={() => play(index)}
                    className={`grid aspect-square place-items-center rounded-xl border border-[#d7e5db] bg-white text-2xl font-bold ${cell === 0 ? 'text-[#156cb0]' : 'text-[#ad512d]'} enabled:hover:bg-[#e5f3e8]`}
                  >
                    {cell === -1 ? '' : cell === 0 ? 'X' : 'O'}
                  </button>
                ))}
              </div>
            )}
            {game.kind === 'connect-four' && (
              <div className="mx-auto max-w-72">
                <div className="mb-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }, (_, column) => (
                    <button
                      key={column}
                      type="button"
                      disabled={!canMove || game.board[column] !== -1}
                      onClick={() => play(column)}
                      aria-label={`Drop in column ${column + 1}`}
                      className="min-h-10 rounded-lg bg-[#e1eee5] text-xs font-bold enabled:hover:bg-[#c8e4d3] disabled:opacity-40"
                    >
                      ↓ {column + 1}
                    </button>
                  ))}
                </div>
                <figure
                  className="grid grid-cols-7 gap-1 rounded-xl bg-[#cde1d4] p-2"
                  aria-label={`Board: ${game.board.map((cell) => (cell === -1 ? 'empty' : cell === 0 ? 'X' : 'O')).join(', ')}`}
                >
                  {game.board.map((cell, index) => (
                    <span
                      key={index}
                      className={`grid aspect-square place-items-center rounded-full text-[10px] font-bold ${cell === -1 ? 'bg-white/90' : cell === 0 ? 'bg-[#287db7] text-white' : 'bg-[#d97b4c] text-white'}`}
                    >
                      {cell === -1 ? '' : cell === 0 ? 'X' : 'O'}
                    </span>
                  ))}
                </figure>
              </div>
            )}
            {game.kind === 'take-21' && (
              <div className="mx-auto max-w-72 rounded-2xl border bg-white p-4 text-center">
                <p className="text-3xl font-extrabold text-[#23725b]">
                  {game.remaining}
                </p>
                <p className="text-[10px] text-[#607767]">
                  counters remaining · last one wins
                </p>
                <div
                  className="my-3 flex flex-wrap justify-center gap-1"
                  aria-hidden="true"
                >
                  {Array.from({ length: game.remaining }, (_, i) => (
                    <span
                      key={i}
                      className="size-3 rounded-full bg-[#7cb293]"
                    />
                  ))}
                </div>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3].map((number) => (
                    <button
                      key={number}
                      type="button"
                      disabled={!canMove || number > game.remaining}
                      onClick={() => play(number)}
                      className="min-h-11 rounded-xl bg-[#e2efe5] px-4 text-xs font-bold disabled:opacity-35"
                    >
                      Take {number}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {game.kind === 'dots-boxes' && (
              <div className="mx-auto w-fit px-6 py-5">
                <div
                  className="relative size-44"
                  aria-label="Dots and boxes board"
                >
                  {game.boxes.map((owner, index) => (
                    <span
                      key={`box${index}`}
                      className={`absolute grid size-[44%] place-items-center rounded-lg text-xl font-bold ${owner === -1 ? 'bg-white/50' : owner === 0 ? 'bg-blue-100 text-[#156cb0]' : 'bg-orange-100 text-[#ad512d]'}`}
                      style={{
                        left: `${(index % 2) * 50 + 3}%`,
                        top: `${Math.floor(index / 2) * 50 + 3}%`,
                      }}
                    >
                      {owner === -1 ? '' : owner === 0 ? 'X' : 'O'}
                    </span>
                  ))}
                  {game.board.map((owner, index) => {
                    const horizontal = index < 6,
                      row = horizontal
                        ? Math.floor(index / 2)
                        : Math.floor((index - 6) / 3),
                      column = horizontal ? index % 2 : (index - 6) % 3;
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={!canMove || owner !== -1}
                        onClick={() => play(index)}
                        aria-label={`${horizontal ? 'Horizontal' : 'Vertical'} edge ${index + 1}${owner !== -1 ? ' drawn' : ''}`}
                        className="absolute z-10 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg enabled:hover:bg-emerald-100/70"
                        style={{
                          left: `${column * 50 + (horizontal ? 25 : 0)}%`,
                          top: `${row * 50 + (horizontal ? 0 : 25)}%`,
                          width: horizontal ? '40%' : 36,
                          height: horizontal ? 36 : '40%',
                        }}
                      >
                        <span
                          className={`${horizontal ? 'h-1 w-full' : 'h-full w-1'} rounded-full ${owner === -1 ? 'bg-[#bed0c1]' : owner === 0 ? 'bg-[#287db7]' : 'bg-[#d97b4c]'}`}
                        />
                      </button>
                    );
                  })}
                  {Array.from({ length: 9 }, (_, index) => (
                    <span
                      key={`dot${index}`}
                      aria-hidden="true"
                      className="pointer-events-none absolute z-20 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#315946]"
                      style={{
                        left: `${(index % 3) * 50}%`,
                        top: `${Math.floor(index / 3) * 50}%`,
                      }}
                    />
                  ))}
                </div>
                <p className="mt-5 text-center text-[10px] font-bold">
                  Boxes: {game.boxes.filter((box) => box === player).length} you
                  ·{' '}
                  {
                    game.boxes.filter((box) => box !== -1 && box !== player)
                      .length
                  }{' '}
                  friend
                </p>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
              <details className="text-[10px] text-[#607767]">
                <summary className="cursor-pointer py-2 font-semibold">
                  How to play
                </summary>
                <p className="max-w-xs py-1 leading-5">{choice?.rules}</p>
              </details>
              {game.phase === 'playing' ? (
                <button
                  type="button"
                  disabled={busy || !connected}
                  onClick={() => void act('resign')}
                  className="min-h-9 shrink-0 rounded-lg border px-3 text-[10px] font-semibold"
                >
                  Leave game
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setChoosing(true)}
                  className="min-h-10 rounded-xl bg-[#23725b] px-4 text-xs font-bold text-white"
                >
                  Play another
                </button>
              )}
            </div>
          </>
        )}
        {!connected && (
          <p className="mt-2 text-xs text-amber-800">
            Reconnecting — moves are paused.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-800">
            {error}
          </p>
        )}
        {busy && (
          <output className="mt-2 block text-[10px] text-[#607767]">
            Updating game…
          </output>
        )}
      </div>
    </section>
  );
}
