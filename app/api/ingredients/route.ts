import { fetchIngredients } from "@/lib/cypher/ingredients";
import { databaseUnavailableResponse, withSession } from "@/lib/neo4j";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ingredients = await withSession((session) => fetchIngredients(session));
    return Response.json({ ingredients });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
