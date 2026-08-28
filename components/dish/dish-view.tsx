"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { postDishDetail } from "@/lib/client-api";
import { DIET_LABELS, type DishDetail } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSaved } from "@/store/savedSlice";
import { DishSkeleton } from "@/components/skeleton";

export function DishView() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const pantry = useAppSelector((s) => s.pantry);
  const saved = useAppSelector((s) => s.saved.items);
  const dispatch = useAppDispatch();
  const [dish, setDish] = useState<DishDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    postDishDetail(slug, pantry.slugs, pantry.leftovers)
      .then((detail) => {
        if (!cancelled) setDish(detail);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, pantry.slugs, pantry.leftovers]);

  if (error) {
    return (
      <div className="rounded-3xl bg-cream p-6">
        <p className="text-chili-deep">{error}</p>
        <button type="button" className="mt-3 text-sm" onClick={() => router.push("/tonight")}>
          Back to tonight
        </button>
      </div>
    );
  }

  if (!dish || dish.slug !== slug) {
    return <DishSkeleton />;
  }

  const isSaved = saved.some((item) => item.slug === dish.slug);

  return (
    <article className="space-y-5 pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-turmeric">
        {dish.region?.name} · {dish.family?.name} · {dish.maxMinutes} min · {DIET_LABELS[dish.diet]}
      </p>
      <h1 className="font-display text-4xl leading-tight">{dish.name}</h1>
      <p className="text-lg text-ink-soft">{dish.gloss}</p>
      <p className="rounded-2xl bg-cream px-4 py-3 text-sm">{dish.why}</p>

      <section>
        <h2 className="font-display text-xl">Already on hand</h2>
        {dish.have.length === 0 ? (
          <p className="text-sm text-ink-soft">Nothing from this dish is in the pantry yet.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {dish.have.map((item) => (
              <li
                key={item.slug}
                className="rounded-full bg-leaf-soft/20 px-3 py-1.5 text-sm text-leaf"
              >
                {item.alias ? `${item.name} (${item.alias})` : item.name}
                {item.leftover ? " · leftover" : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {dish.missing.length > 0 ? (
        <section>
          <h2 className="font-display text-xl">Would shop or skip</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {dish.missing.map((item) => (
              <li key={item.slug} className="rounded-full bg-chili/10 px-3 py-1.5 text-sm text-chili-deep">
                {item.alias ? `${item.name} (${item.alias})` : item.name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {dish.swaps.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-display text-xl">Swap with what you have</h2>
          {dish.swaps.map((swap) => (
            <p key={`${swap.missingSlug}-${swap.usingSlug}`} className="rounded-2xl bg-cream px-4 py-3 text-sm">
              Use <strong>{swap.usingName}</strong> for {swap.missingName.toLowerCase()}. {swap.reason}
            </p>
          ))}
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-xl">Short steps</h2>
        <ol className="mt-3 space-y-3">
          {dish.steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="font-display text-2xl text-turmeric">{index + 1}</span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            dispatch(toggleSaved({ slug: dish.slug, name: dish.name, gloss: dish.gloss }))
          }
          className={`rounded-full px-5 py-3 ${isSaved ? "bg-turmeric" : "bg-cream"}`}
        >
          {isSaved ? "Saved" : "Save"}
        </button>
        <Link href="/tonight" className="ml-auto rounded-full bg-ink px-5 py-3 text-cream">
          Cook this tonight
        </Link>
      </div>
    </article>
  );
}
