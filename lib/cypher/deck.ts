import type { Session } from "neo4j-driver";
import { DISH_MATCH_CYPHER, parseDishRow, parseNamedNode, type GraphDishRow } from "./parse";
import type { Diet } from "../types";
import neo4j from "neo4j-driver";

export type DeckQueryInput = {
  pantry: string[];
  maxMinutes: number;
  allowedDiets: Diet[];
  excludeSlugs: string[];
  allowRich: boolean;
};

export async function fetchDeckCandidates(
  session: Session,
  input: DeckQueryInput,
): Promise<GraphDishRow[]> {
  const result = await session.run(DISH_MATCH_CYPHER, {
    pantry: input.pantry,
    maxMinutes: neo4j.int(input.maxMinutes),
    allowedDiets: input.allowedDiets,
    excludeSlugs: input.excludeSlugs,
    allowRich: input.allowRich,
  });
  return result.records.map(parseDishRow);
}

export async function fetchDishMeta(
  session: Session,
  slug: string | null | undefined,
): Promise<{
  slug: string;
  name: string;
  familySlug: string | null;
  regionSlug: string | null;
  techniqueSlug: string | null;
} | null> {
  if (!slug) return null;
  const result = await session.run(
    `
    MATCH (d:Dish { slug: $slug })
    OPTIONAL MATCH (d)-[:IN_FAMILY]->(fam:FlavorFamily)
    OPTIONAL MATCH (d)-[:FROM_REGION]->(reg:Region)
    OPTIONAL MATCH (d)-[:USES_TECHNIQUE]->(tech:Technique)
    RETURN d.slug AS slug, d.name AS name, fam, reg, tech
    `,
    { slug },
  );
  const record = result.records[0];
  if (!record) return null;
  const fam = parseNamedNode(record.get("fam"));
  const reg = parseNamedNode(record.get("reg"));
  const tech = parseNamedNode(record.get("tech"));
  return {
    slug: String(record.get("slug")),
    name: String(record.get("name")),
    familySlug: fam?.slug ?? null,
    regionSlug: reg?.slug ?? null,
    techniqueSlug: tech?.slug ?? null,
  };
}
