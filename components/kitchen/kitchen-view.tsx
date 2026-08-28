"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchIngredients, searchDishes } from "@/lib/client-api";
import { AISLE_LABELS, DIET_LABELS, TIME_OPTIONS, type Aisle, type Diet, type Ingredient } from "@/lib/types";
import {
  resetConstraints,
  setDiet,
  setMaxMinutes,
  setNamedDish,
  setShopOne,
} from "@/store/constraintsSlice";
import { resetDeck, startFreshDeck } from "@/store/deckSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetPantry, toggleIngredient, toggleLeftover } from "@/store/pantrySlice";
import { resetSaved } from "@/store/savedSlice";

const AISLES: Array<Aisle | "all"> = ["all", "produce", "dairy", "spices", "staples", "fridge"];
const AISLE_PAGE = 12;

function labelFor(ing: Ingredient) {
  return ing.alias ? `${ing.name} (${ing.alias})` : ing.name;
}

function IngredientChip({
  ing,
  on,
  leftover,
  onToggle,
  onLeftover,
}: {
  ing: Ingredient;
  on: boolean;
  leftover: boolean;
  onToggle: () => void;
  onLeftover: () => void;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-stretch overflow-hidden rounded-full ${
        on ? "bg-ink text-cream" : "bg-cream text-ink-soft"
      }`}
    >
      <button type="button" onClick={onToggle} className="truncate px-3 py-1.5 text-left text-sm">
        {labelFor(ing)}
      </button>
      {on ? (
        <button
          type="button"
          title={leftover ? "Unmark leftover" : "Mark as leftover"}
          aria-pressed={leftover}
          onClick={onLeftover}
          className={`shrink-0 border-l px-2 text-[10px] font-bold uppercase tracking-wide ${
            leftover
              ? "border-turmeric/40 bg-turmeric text-ink"
              : "border-cream/20 text-cream/70 hover:text-cream"
          }`}
        >
          {leftover ? "Left" : "+L"}
        </button>
      ) : null}
    </span>
  );
}

export function KitchenView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pantry = useAppSelector((s) => s.pantry);
  const constraints = useAppSelector((s) => s.constraints);

  const [catalog, setCatalog] = useState<Ingredient[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [aisle, setAisle] = useState<Aisle | "all">("all");
  const [aisleShown, setAisleShown] = useState(AISLE_PAGE);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [dishQuery, setDishQuery] = useState("");
  const [dishHits, setDishHits] = useState<{ slug: string; name: string; gloss: string; family: string | null }[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;
    fetchIngredients()
      .then((items) => {
        if (!cancelled) setCatalog(items);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = dishQuery.trim();
    if (q.length < 1) return;
    const handle = setTimeout(() => {
      searchDishes(q)
        .then(setDishHits)
        .catch(() => setDishHits([]));
    }, 180);
    return () => clearTimeout(handle);
  }, [dishQuery]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((ing) => {
      if (aisle !== "all" && ing.aisle !== aisle) return false;
      if (!q) return true;
      return (
        ing.name.toLowerCase().includes(q) ||
        ing.alias.toLowerCase().includes(q) ||
        ing.slug.includes(q)
      );
    });
  }, [catalog, aisle, query]);

  const onShelf = useMemo(
    () => matches.filter((ing) => pantry.slugs.includes(ing.slug)),
    [matches, pantry.slugs],
  );
  const inAisle = useMemo(
    () => matches.filter((ing) => !pantry.slugs.includes(ing.slug)),
    [matches, pantry.slugs],
  );
  const searching = query.trim().length > 0;
  const shelfLimit = 10;
  const visibleShelf = searching || shelfOpen ? onShelf : onShelf.slice(0, shelfLimit);
  const visibleAisle = searching ? inAisle : inAisle.slice(0, aisleShown);

  function setAisleFilter(next: Aisle | "all") {
    setAisle(next);
    setAisleShown(AISLE_PAGE);
  }

  function setSearch(next: string) {
    setQuery(next);
    setAisleShown(AISLE_PAGE);
  }

  function resetDemo() {
    dispatch(resetPantry());
    dispatch(resetConstraints());
    dispatch(resetDeck());
    dispatch(resetSaved());
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-cream p-5 shadow-[0_12px_40px_rgba(42,33,24,0.08)]">
        <p className="font-display text-2xl leading-snug">
          Tap what is actually on the shelf. We walk a kitchen graph — not a recipe search.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Demo kitchen is pre-filled with a mixed Indian pantry. Edit it, then swipe tonight.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-paper-deep px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {pantry.slugs.length} on hand
          </span>
          <button
            type="button"
            onClick={resetDemo}
            className="rounded-full px-3 py-1 text-xs font-semibold text-chili hover:bg-paper"
          >
            Reset demo
          </button>
        </div>
      </section>

      {loadError && catalog.length === 0 ? (
        <p className="text-sm text-ink-soft">The spice aisle will appear once CognoDB is reachable.</p>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl">Pantry</h2>
        <input
          value={query}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jeera, tamarind, paneer…"
          className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none ring-turmeric/40 focus:ring-2"
        />
        <div className="flex flex-wrap gap-1.5">
          {AISLES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setAisleFilter(key)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                aisle === key ? "bg-leaf text-cream" : "bg-cream text-ink-soft"
              }`}
            >
              {key === "all" ? "All aisles" : AISLE_LABELS[key]}
            </button>
          ))}
        </div>
        {catalog.length === 0 && !loadError ? (
          <p className="text-sm text-ink-soft">Loading the spice aisle…</p>
        ) : null}
        {matches.length === 0 && catalog.length > 0 ? (
          <p className="text-sm text-ink-soft">No ingredients match that search.</p>
        ) : null}

        {onShelf.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
              On the shelf
            </p>
            <div className="flex flex-wrap gap-2">
              {visibleShelf.map((ing) => (
                <IngredientChip
                  key={ing.slug}
                  ing={ing}
                  on
                  leftover={pantry.leftovers.includes(ing.slug)}
                  onToggle={() => dispatch(toggleIngredient(ing.slug))}
                  onLeftover={() => dispatch(toggleLeftover(ing.slug))}
                />
              ))}
            </div>
            {!searching && onShelf.length > shelfLimit ? (
              <button
                type="button"
                onClick={() => setShelfOpen((open) => !open)}
                className="text-sm font-medium text-leaf"
              >
                {shelfOpen
                  ? "Show less"
                  : `Show all ${onShelf.length} on the shelf`}
              </button>
            ) : null}
          </div>
        ) : null}

        {inAisle.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
              {searching ? "Add these" : "Add from the aisle"}
            </p>
            <div className="flex flex-wrap gap-2">
              {visibleAisle.map((ing) => (
                <IngredientChip
                  key={ing.slug}
                  ing={ing}
                  on={false}
                  leftover={false}
                  onToggle={() => dispatch(toggleIngredient(ing.slug))}
                  onLeftover={() => dispatch(toggleLeftover(ing.slug))}
                />
              ))}
            </div>
            {!searching && inAisle.length > aisleShown ? (
              <button
                type="button"
                onClick={() => setAisleShown((n) => n + AISLE_PAGE)}
                className="w-full rounded-full bg-cream py-3 text-sm font-medium text-ink"
              >
                Load more · {inAisle.length - aisleShown} left in this aisle
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Tonight</h2>
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => dispatch(setMaxMinutes(mins))}
              className={`rounded-full px-4 py-2 text-sm ${
                constraints.maxMinutes === mins ? "bg-chili text-cream" : "bg-cream text-ink-soft"
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DIET_LABELS) as Diet[]).map((diet) => (
            <button
              key={diet}
              type="button"
              onClick={() => dispatch(setDiet(diet))}
              className={`rounded-full px-4 py-2 text-sm ${
                constraints.diet === diet ? "bg-chili text-cream" : "bg-cream text-ink-soft"
              }`}
            >
              {DIET_LABELS[diet]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => dispatch(setShopOne(!constraints.shopOne))}
          className={`rounded-2xl px-4 py-3 text-left text-sm ${
            constraints.shopOne ? "bg-leaf text-cream" : "bg-cream text-ink-soft"
          }`}
        >
          {constraints.shopOne
            ? "You will shop for one missing thing"
            : "Only dishes I can make now (tap to allow 1 missing)"}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Optional seed</h2>
        <p className="text-sm text-ink-soft">
          Name a dish you loved — we will bias the deck toward that flavor family.
        </p>
        {constraints.namedDishSlug ? (
          <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
            <span>
              Cousin of <strong>{constraints.namedDishName}</strong>
            </span>
            <button
              type="button"
              className="text-sm text-chili"
              onClick={() => dispatch(setNamedDish(null))}
            >
              Clear
            </button>
          </div>
        ) : (
          <div>
            <input
              value={dishQuery}
              onChange={(e) => setDishQuery(e.target.value)}
              placeholder="Butter chicken, sambar…"
              className="w-full rounded-2xl border border-line bg-cream px-4 py-3 outline-none ring-turmeric/40 focus:ring-2"
            />
            {dishQuery.trim().length > 0 && dishHits.length > 0 ? (
              <ul className="mt-2 overflow-hidden rounded-2xl bg-cream">
                {dishHits.map((dish) => (
                  <li key={dish.slug}>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-paper"
                      onClick={() => {
                        dispatch(setNamedDish({ slug: dish.slug, name: dish.name }));
                        setDishQuery("");
                        setDishHits([]);
                      }}
                    >
                      <span className="block font-medium">{dish.name}</span>
                      <span className="block text-xs text-ink-soft">{dish.gloss}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => {
          dispatch(startFreshDeck());
          router.push("/tonight");
        }}
        className="w-full rounded-full bg-ink py-4 font-display text-xl text-cream shadow-[0_10px_30px_rgba(42,33,24,0.2)]"
      >
        Find tonight
      </button>
    </div>
  );
}
