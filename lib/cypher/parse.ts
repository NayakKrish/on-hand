import type { Integer } from "neo4j-driver";
import neo4j, { type Node, type Record as NeoRecord } from "neo4j-driver";
import type { Diet, Heaviness, SubQuality } from "../types";

export type GraphIngredient = {
  slug: string;
  name: string;
  alias: string;
  haveDirect: boolean;
  swaps: {
    slug: string;
    name: string;
    reason: string;
    quality: SubQuality;
  }[];
};

export type GraphDishRow = {
  slug: string;
  name: string;
  gloss: string;
  maxMinutes: number;
  diet: Diet;
  heaviness: Heaviness;
  staple: boolean;
  steps: string[];
  family: { slug: string; name: string; gloss: string } | null;
  region: { slug: string; name: string } | null;
  technique: { slug: string; name: string } | null;
  required: GraphIngredient[];
};

function nodeProps(node: Node | null): Record<string, unknown> | null {
  if (!node) return null;
  return node.properties as Record<string, unknown>;
}

function toNum(value: unknown): number {
  if (neo4j.isInt(value)) return (value as Integer).toNumber();
  if (typeof value === "number") return value;
  return Number(value ?? 0);
}

export function parseNamedNode(
  value: unknown,
): { slug: string; name: string; gloss: string } | null {
  const props = nodeProps(value as Node | null);
  if (!props?.slug) return null;
  return {
    slug: String(props.slug),
    name: String(props.name ?? props.slug),
    gloss: String(props.gloss ?? ""),
  };
}

export function parseDishRow(record: NeoRecord): GraphDishRow {
  const d = nodeProps(record.get("d") as Node)!;
  const family = parseNamedNode(record.get("fam"));
  const region = parseNamedNode(record.get("reg"));
  const technique = parseNamedNode(record.get("tech"));
  const requiredRaw = (record.get("required") as unknown[]) ?? [];

  const required: GraphIngredient[] = requiredRaw
    .filter((row) => row && typeof row === "object")
    .map((row) => {
      const item = row as Record<string, unknown>;
      const swapsRaw = (item.swaps as unknown[]) ?? [];
      return {
        slug: String(item.slug),
        name: String(item.name ?? item.slug),
        alias: String(item.alias ?? ""),
        haveDirect: Boolean(item.haveDirect),
        swaps: swapsRaw
          .filter((s) => s && typeof s === "object")
          .map((s) => {
            const swap = s as Record<string, unknown>;
            return {
              slug: String(swap.slug),
              name: String(swap.name ?? swap.slug),
              reason: String(swap.reason ?? ""),
              quality: (swap.quality as SubQuality) || "ok",
            };
          }),
      };
    });

  const steps = Array.isArray(d.steps) ? d.steps.map(String) : [];

  return {
    slug: String(d.slug),
    name: String(d.name),
    gloss: String(d.gloss ?? ""),
    maxMinutes: toNum(d.maxMinutes),
    diet: d.diet as Diet,
    heaviness: d.heaviness as Heaviness,
    staple: Boolean(d.staple),
    steps,
    family,
    region,
    technique: technique ? { slug: technique.slug, name: technique.name } : null,
    required,
  };
}

export const DISH_MATCH_CYPHER = `
MATCH (d:Dish)
WHERE d.maxMinutes <= $maxMinutes
  AND d.diet IN $allowedDiets
  AND NOT d.slug IN $excludeSlugs
  AND ($allowRich = true OR d.heaviness <> 'rich')
OPTIONAL MATCH (d)-[:IN_FAMILY]->(fam:FlavorFamily)
OPTIONAL MATCH (d)-[:FROM_REGION]->(reg:Region)
OPTIONAL MATCH (d)-[:USES_TECHNIQUE]->(tech:Technique)
OPTIONAL MATCH (d)-[hi:HAS_INGREDIENT]->(ing:Ingredient)
WHERE coalesce(hi.optional, false) = false
OPTIONAL MATCH (ing)<-[sub:CAN_SUBSTITUTE]-(alt:Ingredient)
WHERE alt.slug IN $pantry
WITH d, fam, reg, tech, ing,
     CASE WHEN ing IS NULL THEN false ELSE ing.slug IN $pantry END AS haveDirect,
     collect(DISTINCT CASE WHEN alt IS NULL THEN null ELSE {
       slug: alt.slug,
       name: alt.name,
       reason: sub.reason,
       quality: sub.quality
     } END) AS swapRows
WITH d, fam, reg, tech,
     collect(CASE WHEN ing IS NULL THEN null ELSE {
       slug: ing.slug,
       name: ing.name,
       alias: ing.alias,
       haveDirect: haveDirect,
       swaps: [s IN swapRows WHERE s IS NOT NULL]
     } END) AS ingredientRows
RETURN d, fam, reg, tech,
       [row IN ingredientRows WHERE row IS NOT NULL] AS required
`;
