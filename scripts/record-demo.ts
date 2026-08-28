import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Page } from "playwright";

const BASE = process.env.DEMO_URL ?? "http://127.0.0.1:3000";
const OUT = resolve(process.cwd(), "docs/demo.webm");

async function pause(page: Page, ms = 700) {
  await page.waitForTimeout(ms);
}

async function hideDevOverlay(page: Page) {
  await page.addInitScript(() => {
    const hide = () => {
      document.querySelectorAll("nextjs-portal").forEach((node) => node.remove());
    };
    new MutationObserver(hide).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

async function main() {
  mkdirSync(resolve(process.cwd(), "docs"), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1100, height: 780 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: resolve(process.cwd(), "docs/.pw-video"),
      size: { width: 1100, height: 780 },
    },
  });
  const page = await context.newPage();
  await hideDevOverlay(page);
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Pantry" }).waitFor({ timeout: 20_000 });
  await pause(page, 1100);
  await page.getByText("On the shelf", { exact: true }).waitFor({ timeout: 20_000 });
  await pause(page, 800);

  await page.getByRole("button", { name: "Spices" }).click();
  await pause(page, 900);
  await page.getByRole("button", { name: "All aisles" }).click();
  await pause(page, 600);

  await page.getByPlaceholder("Search jeera, tamarind, paneer…").fill("jeera");
  await pause(page, 800);
  await page.getByPlaceholder("Search jeera, tamarind, paneer…").fill("");
  await pause(page, 500);

  await page.getByRole("button", { name: "30 min" }).click();
  await pause(page, 400);
  await page.getByRole("button", { name: "Veg", exact: true }).click();
  await pause(page, 400);

  await page.getByPlaceholder("Butter chicken, sambar…").fill("butter");
  await pause(page, 700);
  await page.getByRole("button", { name: /Butter chicken/ }).waitFor({ timeout: 10_000 });
  await pause(page, 500);
  await page.getByRole("button", { name: /Butter chicken/ }).click();
  await pause(page, 800);

  await page.getByRole("button", { name: "Find tonight" }).click();
  await pause(page, 1100);
  await page.getByText("Swipe the deck").waitFor({ timeout: 20_000 });
  await page.locator("article").first().waitFor();
  await pause(page, 1400);

  const card = page.locator("article").first();
  const box = await card.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.55, box.y + 90);
    await page.mouse.down();
    await page.mouse.move(box.x + 40, box.y + 90, { steps: 16 });
    await pause(page, 400);
    await page.mouse.up();
  }
  await page.getByRole("heading", { name: /Why not/ }).waitFor({ timeout: 8_000 });
  await pause(page, 700);
  await page.getByRole("button", { name: /Too familiar/ }).click();
  await pause(page, 1400);

  await page.getByRole("button", { name: "Tonight", exact: true }).click();
  await pause(page, 900);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.getByText("Short steps").waitFor({ timeout: 15_000 });
  await pause(page, 1400);

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await pause(page, 700);
  await page.getByRole("link", { name: "Saved" }).click();
  await page.getByRole("heading", { name: /Saved/ }).waitFor();
  await pause(page, 1600);

  await page.close();
  const video = page.video();
  if (!video) throw new Error("Playwright did not record a video");
  await video.saveAs(OUT);
  await video.delete();
  await context.close();
  await browser.close();

  if (!existsSync(OUT)) throw new Error(`Expected video at ${OUT}`);
  console.log(`Wrote ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
