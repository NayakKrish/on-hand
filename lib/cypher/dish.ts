import type { Session } from "neo4j-driver";
import { parseDishRow } from "./parse";
import type { GraphDishRow } from "./parse";

export async function fetchDishDetail(
  session: Session,
  slug: string,
  pantry: string[],
): Promise<GraphDishRow | null> {
  const result = await session.run(
    `
    MATCH (d:Dish { slug: $slug })
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
    `,
    { slug, pantry },
  );
  const record = result.records[0];
  if (!record) return null;
  return parseDishRow(record);
}

export async function searchDishes(session: Session, q: string) {
  const result = await session.run(
    `
    MATCH (d:Dish)
    WHERE $q = '' OR toLower(d.name) CONTAINS $q OR toLower(d.gloss) CONTAINS $q
    OPTIONAL MATCH (d)-[:IN_FAMILY]->(fam:FlavorFamily)
    RETURN d.slug AS slug, d.name AS name, d.gloss AS gloss, fam.name AS family
    ORDER BY d.name
    LIMIT 24
    `,
    { q: q.trim().toLowerCase() },
  );
  return result.records.map((record) => ({
    slug: String(record.get("slug")),
    name: String(record.get("name")),
    gloss: String(record.get("gloss") ?? ""),
    family: record.get("family") ? String(record.get("family")) : null,
  }));
}
