"use client";

import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSaved } from "@/store/savedSlice";

export function SavedView() {
  const items = useAppSelector((s) => s.saved.items);
  const dispatch = useAppDispatch();

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-cream p-8">
        <h1 className="font-display text-3xl">Nothing saved yet</h1>
        <p className="mt-2 text-ink-soft">
          Bookmark a card while you swipe if you want to compare cousins before committing.
        </p>
        <Link href="/tonight" className="mt-6 inline-block rounded-full bg-ink px-5 py-3 text-cream">
          Back to tonight
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Saved for tonight</h1>
      <p className="text-sm text-ink-soft">On this device only — no account.</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.slug} className="rounded-3xl bg-cream p-5">
            <Link href={`/dish/${item.slug}`} className="font-display text-2xl">
              {item.name}
            </Link>
            <p className="mt-1 text-sm text-ink-soft">{item.gloss}</p>
            <button
              type="button"
              className="mt-3 text-sm text-chili"
              onClick={() => dispatch(toggleSaved(item))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
