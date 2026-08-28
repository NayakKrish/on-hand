import { databaseUnavailableResponse, withSession } from "@/lib/neo4j";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await withSession(async (session) => {
      await session.run("RETURN 1 AS ok");
    });
    return Response.json({ ok: true });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
