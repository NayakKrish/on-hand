import type { SteerReason, DeckCard, EmptySuggestion, SwapHint } from "./types";
import type { GraphDishRow } from "./cypher/parse";

export type Coverage = {
  haveCount: number;
  needCount: number;
  missing: { slug: string; name: string; alias: string }[];
  swapHint: SwapHint | null;
  leftoverBoost: boolean;
};

export function coverageFor(
  dish: GraphDishRow,
  pantry: Set<string>,
  leftovers: Set<string>,
): Coverage {
  const missing: Coverage["missing"] = [];
  let haveCount = 0;
  let swapHint: SwapHint | null = null;

  for (const ing of dish.required) {
    const pantrySwap = ing.swaps.find((s) => pantry.has(s.slug));
    if (ing.haveDirect) {
      haveCount += 1;
    } else if (pantrySwap) {
      haveCount += 1;
      if (!swapHint) {
        swapHint = {
          missingSlug: ing.slug,
          missingName: ing.name,
          usingSlug: pantrySwap.slug,
          usingName: pantrySwap.name,
          reason: pantrySwap.reason,
          quality: pantrySwap.quality,
        };
      }
    } else {
      missing.push({ slug: ing.slug, name: ing.name, alias: ing.alias });
    }
  }

  const leftoverBoost = dish.required.some((ing) => leftovers.has(ing.slug));

  return {
    haveCount,
    needCount: dish.required.length,
    missing,
    swapHint,
    leftoverBoost,
  };
}

export function scoreDish(opts: {
  dish: GraphDishRow;
  cover: Coverage;
  named?: { name: string; familySlug: string | null; regionSlug: string | null; techniqueSlug: string | null } | null;
  steer?: SteerReason | null;
  rejected?: { familySlug: string | null; regionSlug: string | null; techniqueSlug: string | null } | null;
}): number {
  const { dish, cover, named, steer, rejected } = opts;
  const ratio = cover.needCount === 0 ? 1 : cover.haveCount / cover.needCount;
  let score = ratio * 24 - cover.missing.length * 9;
  if (cover.swapHint) score += cover.swapHint.quality === "good" ? 4 : 2;
  if (cover.leftoverBoost) score += 6;

  if (named) {
    if (named.familySlug && dish.family?.slug === named.familySlug) score += 14;
    if (named.regionSlug && dish.region?.slug === named.regionSlug) score += 4;
    if (named.techniqueSlug && dish.technique?.slug === named.techniqueSlug) score += 3;
  }

  if (steer === "heavy") {
    if (dish.heaviness === "light") score += 8;
    if (dish.heaviness === "medium") score += 2;
  }

  if (steer === "familiar" && rejected) {
    const sameFamily = Boolean(rejected.familySlug && dish.family?.slug === rejected.familySlug);
    const sameTech = Boolean(rejected.techniqueSlug && dish.technique?.slug === rejected.techniqueSlug);
    const sameRegion = Boolean(rejected.regionSlug && dish.region?.slug === rejected.regionSlug);
    if (sameFamily && dish.staple) score -= 12;
    if (sameFamily && !sameTech) score += 10;
    if (!sameFamily && sameRegion) score += 6;
  }

  return score;
}

export function buildWhy(
  dish: GraphDishRow,
  cover: Coverage,
  namedName: string | null,
): string {
  const parts: string[] = [];
  if (namedName && dish.family) {
    parts.push(`Same ${dish.family.name.toLowerCase()} family as ${namedName}`);
  } else if (dish.family) {
    parts.push(`In the ${dish.family.name.toLowerCase()} family`);
  }
  if (cover.swapHint) {
    parts.push(`Use ${cover.swapHint.usingName.toLowerCase()} for ${cover.swapHint.missingName.toLowerCase()}`);
  } else if (cover.missing.length === 0) {
    parts.push("You have what you need");
  } else if (cover.missing.length === 1) {
    parts.push(`One gap: ${cover.missing[0].name.toLowerCase()}`);
  }
  if (cover.leftoverBoost) parts.push("Uses a leftover");
  return parts.join(" · ");
}

export function toCard(
  dish: GraphDishRow,
  cover: Coverage,
  namedName: string | null,
): DeckCard {
  return {
    slug: dish.slug,
    name: dish.name,
    gloss: dish.gloss,
    maxMinutes: dish.maxMinutes,
    diet: dish.diet,
    heaviness: dish.heaviness,
    staple: dish.staple,
    family: dish.family,
    region: dish.region,
    technique: dish.technique,
    haveCount: cover.haveCount,
    needCount: cover.needCount,
    missing: cover.missing,
    swapHint: cover.swapHint,
    leftoverBoost: cover.leftoverBoost,
    cousinOf: namedName,
    why: buildWhy(dish, cover, namedName),
  };
}

export function emptySuggestions(
  nearMisses: { dish: GraphDishRow; cover: Coverage }[],
  shopOne: boolean,
): { reasons: string[]; suggestions: EmptySuggestion[] } {
  const reasons: string[] = [];
  const suggestions: EmptySuggestion[] = [];

  if (nearMisses.length === 0) {
    reasons.push("Nothing in the graph matches this time and diet. Loosen time, or switch diet.");
    return { reasons, suggestions };
  }

  const oneGap = nearMisses.filter((m) => m.cover.missing.length === 1);
  if (!shopOne && oneGap.length > 0) {
    reasons.push(
      `${oneGap.length} dish${oneGap.length === 1 ? "" : "es"} need just one missing ingredient.`,
    );
    suggestions.push({
      kind: "shopOne",
      label: "Allow 1 missing ingredient",
    });
  }

  const counts = new Map<string, { name: string; n: number }>();
  for (const miss of nearMisses) {
    for (const item of miss.cover.missing) {
      const prev = counts.get(item.slug) ?? { name: item.name, n: 0 };
      prev.n += 1;
      counts.set(item.slug, prev);
    }
  }
  const top = [...counts.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 4);
  for (const [slug, info] of top) {
    suggestions.push({
      kind: "ingredient",
      slug,
      name: info.name,
      label: `Add ${info.name.toLowerCase()}`,
    });
  }
  if (top[0]) {
    reasons.push(`Adding ${top[0][1].name.toLowerCase()} would unlock the most plates.`);
  }

  return { reasons, suggestions };
}
