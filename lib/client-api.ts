import type { DeckRequestBody } from "./deck-request";
import type { DeckResponse, DishDetail, Ingredient } from "./types";

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    return body.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function fetchHealth(): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch("/api/health");
  if (!res.ok) {
    const message = await readError(res);
    return { ok: false, message };
  }
  return { ok: true };
}

export async function fetchIngredients(): Promise<Ingredient[]> {
  const res = await fetch("/api/ingredients");
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { ingredients: Ingredient[] };
  return body.ingredients;
}

export async function searchDishes(q: string) {
  const res = await fetch(`/api/dishes?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as {
    dishes: { slug: string; name: string; gloss: string; family: string | null }[];
  };
  return body.dishes;
}

export async function postDeck(body: DeckRequestBody): Promise<DeckResponse> {
  const res = await fetch("/api/deck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as DeckResponse;
}

export async function postDishDetail(
  slug: string,
  pantry: string[],
  leftovers: string[],
): Promise<DishDetail> {
  const res = await fetch(`/api/dishes/${encodeURIComponent(slug)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pantry, leftovers }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as DishDetail;
}
