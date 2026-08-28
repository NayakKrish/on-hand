import { fetchDishDetail } from "@/lib/cypher/dish";
import { databaseUnavailableResponse, withSession } from "@/lib/neo4j";
import { buildWhy, coverageFor } from "@/lib/ranking";
import type { DishDetail } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const body = (await request.json()) as {
      pantry?: string[];
      leftovers?: string[];
      namedDishSlug?: string | null;
    };
    const pantry = Array.isArray(body.pantry) ? body.pantry.map(String) : [];
    const leftoverSet = new Set(Array.isArray(body.leftovers) ? body.leftovers.map(String) : []);
    const pantrySet = new Set(pantry);

    const detail = await withSession((session) => fetchDishDetail(session, slug, pantry));
    if (!detail) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const cover = coverageFor(detail, pantrySet, leftoverSet);
    const have = detail.required
      .filter((ing) => ing.haveDirect || ing.swaps.some((s) => pantrySet.has(s.slug)))
      .map((ing) => ({
        slug: ing.slug,
        name: ing.name,
        alias: ing.alias,
        leftover: leftoverSet.has(ing.slug),
      }));

    const swaps = detail.required.flatMap((ing) => {
      if (ing.haveDirect) return [];
      return ing.swaps
        .filter((s) => pantrySet.has(s.slug))
        .map((s) => ({
          missingSlug: ing.slug,
          missingName: ing.name,
          usingSlug: s.slug,
          usingName: s.name,
          reason: s.reason,
          quality: s.quality,
        }));
    });

    const payload: DishDetail = {
      slug: detail.slug,
      name: detail.name,
      gloss: detail.gloss,
      maxMinutes: detail.maxMinutes,
      diet: detail.diet,
      heaviness: detail.heaviness,
      staple: detail.staple,
      family: detail.family,
      region: detail.region,
      technique: detail.technique,
      steps: detail.steps,
      have,
      missing: cover.missing,
      swaps,
      why: buildWhy(detail, cover, null),
    };

    return Response.json(payload);
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
