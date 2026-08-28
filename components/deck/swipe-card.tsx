"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { DeckCard } from "@/lib/types";

type Props = {
  card: DeckCard;
  busy?: boolean;
  saved: boolean;
  hintNudge?: boolean;
  onLeft: () => void;
  onRight: () => void;
  onOpen: () => void;
  onSave: () => void;
};

export function DockCard({ card, depth }: { card: DeckCard; depth: 1 | 2 }) {
  return (
    <div
      className="rounded-3xl border border-line bg-cream px-5 py-3 shadow-[0_8px_20px_rgba(42,33,24,0.08)]"
      style={{
        marginTop: depth === 1 ? -14 : -18,
        marginLeft: depth * 10,
        marginRight: depth * 10,
        opacity: depth === 1 ? 0.88 : 0.62,
        zIndex: 3 - depth,
      }}
      aria-hidden
    >
      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-turmeric">
        {card.region?.name ?? "Next"} · {card.maxMinutes} min
      </p>
      <p className="font-display truncate text-xl leading-tight text-ink">
        {card.name}
      </p>
    </div>
  );
}

export function SwipeCard({
  card,
  busy,
  saved,
  hintNudge,
  onLeft,
  onRight,
  onOpen,
  onSave,
}: Props) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  function pointerDown(event: PointerEvent) {
    startX.current = event.clientX;
    setDragging(true);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent) {
    if (startX.current == null) return;
    setDx(event.clientX - startX.current);
  }

  function pointerUp() {
    if (startX.current == null) return;
    if (dx > 90) onRight();
    else if (dx < -90) onLeft();
    startX.current = null;
    setDragging(false);
    setDx(0);
  }

  const rotate = dx / 18;
  const skipOpacity = Math.min(1, Math.max(0, -dx / 90));
  const cookOpacity = Math.min(1, Math.max(0, dx / 90));

  return (
    <article
      className={`relative z-10 flex min-h-95 touch-none select-none flex-col rounded-3xl bg-cream p-5 shadow-[0_22px_50px_rgba(42,33,24,0.18)] ${
        hintNudge && dx === 0 ? "animate-deck-nudge" : ""
      }`}
      style={{
        transform: `translateX(${dx}px) rotate(${rotate}deg)`,
        cursor: dragging ? "grabbing" : "grab",
      }}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
    >
      <div
        className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-paper-deep"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute left-4 top-8 rounded-full border-2 border-chili px-3 py-1 text-xs font-bold uppercase tracking-wide text-chili"
        style={{ opacity: skipOpacity, transform: "rotate(-12deg)" }}
      >
        Not this
      </div>
      <div
        className="pointer-events-none absolute right-4 top-8 rounded-full border-2 border-leaf px-3 py-1 text-xs font-bold uppercase tracking-wide text-leaf"
        style={{ opacity: cookOpacity, transform: "rotate(12deg)" }}
      >
        Tonight
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-turmeric">
        {card.region?.name ?? "Indian kitchen"} · {card.maxMinutes} min
      </p>
      <h2 className="mt-2 font-display text-4xl leading-tight">{card.name}</h2>
      <p className="mt-2 text-ink-soft">{card.gloss}</p>
      <p className="mt-4 rounded-2xl bg-paper px-3 py-3 text-sm">{card.why}</p>
      <p className="mt-3 text-sm">
        Have {card.haveCount} of {card.needCount}
        {card.missing.length === 1
          ? ` · missing ${card.missing[0].name.toLowerCase()}`
          : ""}
      </p>
      {busy ? (
        <p className="mt-2 text-xs text-ink-soft">Finding the next cluster…</p>
      ) : null}

      <p className="mt-4 text-center text-sm font-medium text-ink">
        Drag this card left or right
      </p>

      <div className="mt-auto flex gap-2 pt-4">
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onSave}
          className={`rounded-full px-4 py-2 text-sm ${saved ? "bg-turmeric text-ink" : "bg-paper"}`}
        >
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onOpen}
          className="ml-auto rounded-full bg-ink px-4 py-2 text-sm text-cream"
        >
          Open
        </button>
      </div>
    </article>
  );
}
