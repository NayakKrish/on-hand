import neo4j, { type Driver, type Integer, type Session } from "neo4j-driver";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (driver) return driver;

  const uri = process.env.COGNODB_URI;
  const username = process.env.COGNODB_USERNAME;
  const password = process.env.COGNODB_PASSWORD;

  if (!uri || !username || !password) {
    throw new Error(
      "Missing CognoDB connection details. Set COGNODB_URI, COGNODB_USERNAME, and COGNODB_PASSWORD.",
    );
  }

  driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  return driver;
}

export async function withSession<T>(work: (session: Session) => Promise<T>): Promise<T> {
  const session = getDriver().session();
  try {
    return await work(session);
  } finally {
    await session.close();
  }
}

export function toNumber(value: unknown): number {
  if (neo4j.isInt(value)) return (value as Integer).toNumber();
  if (typeof value === "number") return value;
  return Number(value);
}

export function isDatabaseError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String(error.message) : String(error);
  return (
    message.includes("Missing CognoDB") ||
    message.includes("ECONNREFUSED") ||
    message.includes("Failed to connect") ||
    message.includes("ServiceUnavailable") ||
    message.includes("N/A") ||
    message.includes("authentication") ||
    message.includes("unauthorized") ||
    message.includes("Timeout") ||
    message.includes("timed out")
  );
}

export function databaseUnavailableResponse(error: unknown) {
  console.error("[cognodb]", error);
  return Response.json(
    {
      error: "database_unavailable",
      message:
        "On Hand cannot reach the kitchen graph right now. Check that CognoDB is running and your env vars are set.",
    },
    { status: 503 },
  );
}
