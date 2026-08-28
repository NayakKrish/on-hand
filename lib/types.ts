export type Aisle = "produce" | "dairy" | "spices" | "staples" | "fridge";
export type Diet = "vegan" | "veg" | "egg" | "nonveg";
export type Heaviness = "light" | "medium" | "rich";
export type IngredientRole = "base" | "spice" | "sour" | "fat" | "protein";
export type SubQuality = "good" | "ok" | "weak";
export type SteerReason = "heavy" | "long" | "familiar";

export const AISLE_LABELS: Record<Aisle, string> = {
  produce: "Produce",
  dairy: "Dairy",
  spices: "Spices",
  staples: "Staples",
  fridge: "Fridge",
};

export const DIET_LABELS: Record<Diet, string> = {
  vegan: "Vegan",
  veg: "Veg",
  egg: "Egg",
  nonveg: "Non-veg",
};

export const TIME_OPTIONS = [15, 30, 45] as const;

export type Ingredient = {
  slug: string;
  name: string;
  alias: string;
  aisle: Aisle;
};

export type DishSummary = {
  slug: string;
  name: string;
  gloss: string;
  maxMinutes: number;
  diet: Diet;
  heaviness: Heaviness;
  staple: boolean;
  family: { slug: string; name: string; gloss: string } | null;
  region: { slug: string; name: string } | null;
  technique: { slug: string; name: string } | null;
};

export type SwapHint = {
  missingSlug: string;
  missingName: string;
  usingSlug: string;
  usingName: string;
  reason: string;
  quality: SubQuality;
};

export type DeckCard = DishSummary & {
  haveCount: number;
  needCount: number;
  missing: { slug: string; name: string; alias: string }[];
  swapHint: SwapHint | null;
  leftoverBoost: boolean;
  cousinOf: string | null;
  why: string;
};

export type EmptySuggestion = {
  kind: "ingredient" | "shopOne";
  slug?: string;
  name?: string;
  label: string;
};

export type DeckResponse = {
  cards: DeckCard[];
  emptyReasons: string[];
  suggestions: EmptySuggestion[];
};

export type DishDetail = DishSummary & {
  steps: string[];
  have: { slug: string; name: string; alias: string; leftover: boolean }[];
  missing: { slug: string; name: string; alias: string }[];
  swaps: SwapHint[];
  why: string;
};
