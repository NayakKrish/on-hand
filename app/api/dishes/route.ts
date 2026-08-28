import { searchDishes } from "@/lib/cypher/dish";
import { databaseUnavailableResponse, withSession } from "@/lib/neo4j";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const dishes = await withSession((session) => searchDishes(session, q));
    return Response.json({ dishes });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
