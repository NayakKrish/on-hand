import { fetchDeckCandidates, fetchDishMeta } from "@/lib/cypher/deck";
import { parseDeckBody } from "@/lib/deck-request";
import { allowedDiets } from "@/lib/diet";
import { databaseUnavailableResponse, withSession } from "@/lib/neo4j";
import {
  coverageFor,
  emptySuggestions,
  scoreDish,
  toCard,
} from "@/lib/ranking";
import type { DeckResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = parseDeckBody(await request.json());
    const pantry = [...new Set(body.pantry)];
    const leftoverSet = new Set(body.leftovers ?? []);
    const pantrySet = new Set(pantry);
    const maxMissing = body.shopOne ? 1 : 0;
    const allowRich = body.steer !== "heavy";

    const payload = await withSession(async (session) => {
      const named = await fetchDishMeta(session, body.namedDishSlug);
      const rejected = await fetchDishMeta(session, body.lastRejectedSlug);
      const rows = await fetchDeckCandidates(session, {
        pantry,
        maxMinutes: body.maxMinutes,
        allowedDiets: allowedDiets(body.diet),
        excludeSlugs: body.excludeSlugs ?? [],
        allowRich,
      });

      const scored = rows.map((dish) => {
        const cover = coverageFor(dish, pantrySet, leftoverSet);
        const score = scoreDish({
          dish,
          cover,
          named,
          steer: body.steer ?? null,
          rejected,
        });
        return { dish, cover, score };
      });

      const playable = scored
        .filter((row) => row.cover.missing.length <= maxMissing)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

      const cards = playable.map((row) =>
        toCard(
          row.dish,
          row.cover,
          named && row.dish.family?.slug === named.familySlug
            ? named.name
            : null,
        ),
      );

      if (cards.length > 0) {
        const response: DeckResponse = {
          cards,
          emptyReasons: [],
          suggestions: [],
        };
        return response;
      }

      const near = scored
        .filter(
          (row) =>
            row.cover.missing.length > 0 && row.cover.missing.length <= 3,
        )
        .sort(
          (a, b) =>
            a.cover.missing.length - b.cover.missing.length ||
            b.score - a.score,
        );

      const empty = emptySuggestions(near, body.shopOne);
      const response: DeckResponse = {
        cards: [],
        emptyReasons: empty.reasons,
        suggestions: empty.suggestions,
      };
      return response;
    });

    return Response.json(payload);
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
