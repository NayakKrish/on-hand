import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import neo4j from "neo4j-driver";
import { getDriver } from "../lib/neo4j";
import {
  dishes,
  families,
  ingredients,
  regions,
  substitutes,
  techniques,
} from "./data/graph";

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

if (!process.env.COGNODB_URI || !process.env.COGNODB_PASSWORD) {
  console.error(
    "Missing COGNODB_URI / COGNODB_PASSWORD. Copy .env.example to .env.local and fill in your CognoDB Cloud credentials.",
  );
  process.exit(1);
}

function validate() {
  const ingredientSlugs = new Set(ingredients.map((i) => i.slug));
  const techniqueSlugs = new Set(techniques.map((t) => t.slug));
  const familySlugs = new Set(families.map((f) => f.slug));
  const regionSlugs = new Set(regions.map((r) => r.slug));

  for (const dish of dishes) {
    if (!techniqueSlugs.has(dish.technique)) {
      throw new Error(
        `Dish ${dish.slug} has unknown technique ${dish.technique}`,
      );
    }
    if (!familySlugs.has(dish.family)) {
      throw new Error(`Dish ${dish.slug} has unknown family ${dish.family}`);
    }
    if (!regionSlugs.has(dish.region)) {
      throw new Error(`Dish ${dish.slug} has unknown region ${dish.region}`);
    }
    for (const item of dish.ingredients) {
      if (!ingredientSlugs.has(item.slug)) {
        throw new Error(
          `Dish ${dish.slug} has unknown ingredient ${item.slug}`,
        );
      }
    }
  }

  for (const sub of substitutes) {
    if (!ingredientSlugs.has(sub.from) || !ingredientSlugs.has(sub.to)) {
      throw new Error(
        `Substitute ${sub.from} -> ${sub.to} references unknown ingredient`,
      );
    }
  }
}

async function seed() {
  validate();
  const driver = getDriver();
  const session = driver.session();

  try {
    await session.run(`
      MATCH (n)
      WHERE n:Dish OR n:Ingredient OR n:Technique OR n:FlavorFamily OR n:Region
      DETACH DELETE n
    `);

    await session.run(
      `CREATE CONSTRAINT dish_slug IF NOT EXISTS FOR (d:Dish) REQUIRE d.slug IS UNIQUE`,
    );
    await session.run(
      `CREATE CONSTRAINT ingredient_slug IF NOT EXISTS FOR (i:Ingredient) REQUIRE i.slug IS UNIQUE`,
    );
    await session.run(
      `CREATE CONSTRAINT technique_slug IF NOT EXISTS FOR (t:Technique) REQUIRE t.slug IS UNIQUE`,
    );
    await session.run(
      `CREATE CONSTRAINT family_slug IF NOT EXISTS FOR (f:FlavorFamily) REQUIRE f.slug IS UNIQUE`,
    );
    await session.run(
      `CREATE CONSTRAINT region_slug IF NOT EXISTS FOR (r:Region) REQUIRE r.slug IS UNIQUE`,
    );

    await session.run(
      `
      UNWIND $rows AS row
      CREATE (r:Region { slug: row.slug, name: row.name, gloss: row.gloss })
      `,
      { rows: regions },
    );

    await session.run(
      `
      UNWIND $rows AS row
      CREATE (t:Technique { slug: row.slug, name: row.name, gloss: row.gloss })
      `,
      { rows: techniques },
    );

    await session.run(
      `
      UNWIND $rows AS row
      CREATE (f:FlavorFamily { slug: row.slug, name: row.name, gloss: row.gloss })
      `,
      { rows: families },
    );

    await session.run(
      `
      UNWIND $rows AS row
      CREATE (i:Ingredient {
        slug: row.slug,
        name: row.name,
        alias: row.alias,
        aisle: row.aisle
      })
      `,
      { rows: ingredients },
    );

    // (have)-[:CAN_SUBSTITUTE]->(missing): lemon substitutes for tamarind.
    await session.run(
      `
      UNWIND $rows AS row
      MATCH (missing:Ingredient { slug: row.from })
      MATCH (have:Ingredient { slug: row.to })
      CREATE (have)-[:CAN_SUBSTITUTE { context: row.context, reason: row.reason, quality: row.quality }]->(missing)
      `,
      { rows: substitutes },
    );

    await session.run(
      `
      UNWIND $rows AS row
      CREATE (d:Dish {
        slug: row.slug,
        name: row.name,
        gloss: row.gloss,
        maxMinutes: row.maxMinutes,
        diet: row.diet,
        heaviness: row.heaviness,
        staple: row.staple,
        steps: row.steps
      })
      WITH d, row
      MATCH (reg:Region { slug: row.region })
      MATCH (fam:FlavorFamily { slug: row.family })
      MATCH (tech:Technique { slug: row.technique })
      CREATE (d)-[:FROM_REGION]->(reg)
      CREATE (d)-[:IN_FAMILY]->(fam)
      CREATE (d)-[:USES_TECHNIQUE]->(tech)
      WITH d, row
      UNWIND row.ingredients AS item
      MATCH (i:Ingredient { slug: item.slug })
      CREATE (d)-[:HAS_INGREDIENT { optional: item.optional, role: item.role }]->(i)
      `,
      {
        rows: dishes.map((dish) => ({
          ...dish,
          staple: Boolean(dish.staple),
          maxMinutes: neo4j.int(dish.maxMinutes),
          ingredients: dish.ingredients.map((item) => ({
            slug: item.slug,
            optional: Boolean(item.optional),
            role: item.role,
          })),
        })),
      },
    );

    const counts = await session.run(`
      MATCH (d:Dish)
      WITH count(d) AS dishes
      MATCH (i:Ingredient)
      WITH dishes, count(i) AS ingredients
      MATCH ()-[s:CAN_SUBSTITUTE]->()
      RETURN dishes, ingredients, count(s) AS substitutes
    `);
    const rec = counts.records[0];
    console.log(
      `Seeded ${rec.get("dishes")} dishes, ${rec.get("ingredients")} ingredients, ${rec.get("substitutes")} substitutes.`,
    );
  } finally {
    await session.close();
    await driver.close();
  }
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
