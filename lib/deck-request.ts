import type { Diet, SteerReason } from "./types";

export type DeckRequestBody = {
  pantry: string[];
  leftovers?: string[];
  maxMinutes: number;
  diet: Diet;
  shopOne: boolean;
  namedDishSlug?: string | null;
  excludeSlugs?: string[];
  steer?: SteerReason | null;
  lastRejectedSlug?: string | null;
};

export function parseDeckBody(raw: unknown): DeckRequestBody {
  const body = (raw ?? {}) as Record<string, unknown>;
  const pantry = Array.isArray(body.pantry) ? body.pantry.map(String) : [];
  const leftovers = Array.isArray(body.leftovers) ? body.leftovers.map(String) : [];
  const maxMinutes = Number(body.maxMinutes) || 30;
  const diet = (body.diet as Diet) || "veg";
  const shopOne = Boolean(body.shopOne);
  const namedDishSlug = body.namedDishSlug ? String(body.namedDishSlug) : null;
  const excludeSlugs = Array.isArray(body.excludeSlugs) ? body.excludeSlugs.map(String) : [];
  const steer = (body.steer as SteerReason | null) ?? null;
  const lastRejectedSlug = body.lastRejectedSlug ? String(body.lastRejectedSlug) : null;
  return {
    pantry,
    leftovers,
    maxMinutes,
    diet,
    shopOne,
    namedDishSlug,
    excludeSlugs,
    steer,
    lastRejectedSlug,
  };
}
