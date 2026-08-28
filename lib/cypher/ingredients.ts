import type { Session } from "neo4j-driver";
import type { Aisle } from "../types";

export async function fetchIngredients(session: Session) {
  const result = await session.run(
    `
    MATCH (i:Ingredient)
    RETURN i.slug AS slug, i.name AS name, i.alias AS alias, i.aisle AS aisle
    ORDER BY i.aisle, i.name
    `,
  );
  return result.records.map((record) => ({
    slug: String(record.get("slug")),
    name: String(record.get("name")),
    alias: String(record.get("alias") ?? ""),
    aisle: record.get("aisle") as Aisle,
  }));
}
