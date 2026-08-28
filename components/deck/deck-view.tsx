"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { postDeck } from "@/lib/client-api";
import { tightenTime } from "@/lib/diet";
import type { SteerReason } from "@/lib/types";
import { setMaxMinutes, setShopOne } from "@/store/constraintsSlice";
import {
  deckError,
  deckLoading,
  deckReady,
  markSeen,
  setSteer,
} from "@/store/deckSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addIngredient } from "@/store/pantrySlice";
import { toggleSaved } from "@/store/savedSlice";
import { DockCard, SwipeCard } from "./swipe-card";

const REASONS: { id: SteerReason; label: string; hint: string }[] = [
  { id: "heavy", label: "Too heavy", hint: "Walk away from rich gravies" },
  { id: "long", label: "Too long", hint: "Tighten time for the next cards" },
  { id: "familiar", label: "Too familiar", hint: "Skip this family’s staples" },
];

export function DeckView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pantry = useAppSelector((s) => s.pantry);
  const constraints = useAppSelector((s) => s.constraints);
  const deck = useAppSelector((s) => s.deck);
  const saved = useAppSelector((s) => s.saved.items);
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [nudged, setNudged] = useState(false);

  const load = useCallback(async () => {
    dispatch(deckLoading());
    try {
      const result = await postDeck({
        pantry: pantry.slugs,
        leftovers: pantry.leftovers,
        maxMinutes: constraints.maxMinutes,
        diet: constraints.diet,
        shopOne: constraints.shopOne,
        namedDishSlug: constraints.namedDishSlug,
        excludeSlugs: deck.seenSlugs,
        steer: deck.steer,
        lastRejectedSlug: deck.lastRejectedSlug,
      });
      dispatch(deckReady(result));
    } catch (err) {
      dispatch(
        deckError(
          err instanceof Error ? err.message : "Could not load tonight.",
        ),
      );
    }
  }, [
    constraints.diet,
    constraints.maxMinutes,
    constraints.namedDishSlug,
    constraints.shopOne,
    deck.lastRejectedSlug,
    deck.seenSlugs,
    deck.steer,
    dispatch,
    pantry.leftovers,
    pantry.slugs,
  ]);

  const pantryKey = pantry.slugs.join("|");
  const leftoverKey = pantry.leftovers.join("|");
  const seenKey = deck.seenSlugs.join("|");

  useEffect(() => {
    void load();
  }, [
    constraints.diet,
    constraints.maxMinutes,
    constraints.namedDishSlug,
    constraints.shopOne,
    deck.steer,
    deck.lastRejectedSlug,
    leftoverKey,
    load,
    pantryKey,
    seenKey,
  ]);

  const top = deck.cards[0];
  const next = deck.cards[1];
  const after = deck.cards[2];
  const remaining = Math.max(0, deck.cards.length - 1);

  useEffect(() => {
    if (!top || nudged) return;
    const timer = window.setTimeout(() => setNudged(true), 2200);
    return () => window.clearTimeout(timer);
  }, [nudged, top]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!top || reasonFor) return;
      if (event.key === "ArrowLeft") setReasonFor(top.slug);
      if (event.key === "ArrowRight") {
        dispatch(markSeen(top.slug));
        router.push(`/dish/${top.slug}`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, reasonFor, router, top]);

  function tonight() {
    if (!top) return;
    dispatch(markSeen(top.slug));
    router.push(`/dish/${top.slug}`);
  }

  function reject(reason: SteerReason) {
    if (!top) return;
    dispatch(markSeen(top.slug));
    if (reason === "long") {
      dispatch(setMaxMinutes(tightenTime(constraints.maxMinutes)));
    }
    dispatch(setSteer({ reason, lastRejectedSlug: top.slug }));
    setReasonFor(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl">Tonight</h1>
        <p className="text-sm text-ink-soft">
          A deck of cousins from the kitchen graph. Swipe, or tap the arrows.
        </p>
      </div>

      {deck.status === "loading" && !top ? (
        <div className="flex h-105 items-center justify-center rounded-3xl bg-cream text-ink-soft">
          Walking the kitchen graph…
        </div>
      ) : null}

      {deck.status === "error" ? (
        <div className="rounded-3xl bg-cream p-6 text-chili-deep">
          {deck.error}
        </div>
      ) : null}

      {deck.status === "ready" && !top ? (
        <div className="space-y-4 rounded-3xl bg-cream p-6">
          <h2 className="font-display text-2xl">
            Nothing in this pantry window
          </h2>
          {deck.emptyReasons.map((reason) => (
            <p key={reason} className="text-ink-soft">
              {reason}
            </p>
          ))}
          <div className="flex flex-wrap gap-2">
            {deck.suggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                className="rounded-full bg-ink px-4 py-2 text-sm text-cream"
                onClick={() => {
                  if (suggestion.kind === "shopOne") dispatch(setShopOne(true));
                  if (suggestion.kind === "ingredient" && suggestion.slug) {
                    dispatch(addIngredient(suggestion.slug));
                  }
                }}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {top ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
            <span>Swipe the deck</span>
            <span>
              {remaining === 0 ? "Last card" : `${remaining} more under this`}
            </span>
          </div>

          <div className="relative mx-auto max-w-md">
            <div className="flex flex-col px-10 sm:px-12">
              <SwipeCard
                card={top}
                busy={deck.status === "loading"}
                saved={saved.some((item) => item.slug === top.slug)}
                hintNudge={!nudged}
                onLeft={() => setReasonFor(top.slug)}
                onRight={tonight}
                onOpen={tonight}
                onSave={() =>
                  dispatch(
                    toggleSaved({
                      slug: top.slug,
                      name: top.name,
                      gloss: top.gloss,
                    }),
                  )
                }
              />
              {next ? <DockCard card={next} depth={1} /> : null}
              {after ? <DockCard card={after} depth={2} /> : null}
            </div>

            <button
              type="button"
              aria-label="Not this cluster"
              onClick={() => setReasonFor(top.slug)}
              className="absolute left-0 top-47.5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-cream text-lg shadow-[0_8px_20px_rgba(42,33,24,0.12)]"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Cook this tonight"
              onClick={tonight}
              className="absolute right-0 top-47.5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-lg text-cream shadow-[0_8px_20px_rgba(42,33,24,0.12)]"
            >
              →
            </button>
          </div>

          <p className="text-center text-sm text-ink-soft">
            <span className="text-chili">← skip this family</span>
            <span className="mx-2 text-ink/30">·</span>
            <span className="text-leaf">cook tonight →</span>
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setReasonFor(top.slug)}
              className="flex-1 rounded-full bg-cream py-3"
            >
              Not this cluster
            </button>
            <button
              type="button"
              onClick={tonight}
              className="flex-1 rounded-full bg-ink py-3 text-cream"
            >
              Tonight
            </button>
          </div>
        </div>
      ) : null}

      {reasonFor && top ? (
        <div className="fixed inset-0 z-30 flex items-end bg-ink/40 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-3xl bg-cream p-5">
            <h3 className="font-display text-2xl">Why not {top.name}?</h3>
            <p className="mt-1 text-sm text-ink-soft">
              The next card should move in the graph.
            </p>
            <div className="mt-4 space-y-2">
              {REASONS.map((reason) => (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => reject(reason.id)}
                  className="w-full rounded-2xl bg-paper px-4 py-3 text-left"
                >
                  <span className="block font-medium">{reason.label}</span>
                  <span className="block text-xs text-ink-soft">
                    {reason.hint}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 w-full py-2 text-sm text-ink-soft"
              onClick={() => setReasonFor(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
