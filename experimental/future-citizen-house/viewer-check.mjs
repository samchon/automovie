import { chromium } from "file:///D:/github/samchon/AutoMovie/test/node_modules/playwright/index.mjs";
import { join } from "node:path";

const browser = await chromium.launch({ channel: "chromium", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(String(error)));

await page.goto("http://127.0.0.1:4174/", { waitUntil: "networkidle" });
await page.waitForFunction(() => document.querySelector("#build-status")?.textContent?.includes("built from current source"));

const initial = await page.evaluate(() => ({
  title: document.querySelector("#environment-title")?.textContent,
  status: document.querySelector("#build-status")?.textContent,
  options: Array.from(document.querySelectorAll("#space-select option")).map((option) => option.value),
  canvas: {
    width: document.querySelector("#scene")?.clientWidth,
    height: document.querySelector("#scene")?.clientHeight,
  },
}));
const initialScreenshotPath = join(process.env.TEMP ?? "C:/Windows/Temp", "future-citizen-house-whole.png");
await page.locator("#scene").screenshot({ path: initialScreenshotPath });
const initialCanvas = await page.locator("#scene").screenshot();

await page.locator("#space-select").selectOption("upper-corridor");
await page.locator("#view-mode").selectOption("upper");
await page.locator("#interior-only").check();
const beforeInteraction = await page.evaluate(() => ({
  selected: document.querySelector("#space-select")?.value,
  mode: document.querySelector("#view-mode")?.value,
  interiorOnly: document.querySelector("#interior-only")?.checked,
  spaceTitle: document.querySelector("#space-title")?.textContent,
}));

const box = await page.locator("#scene").boundingBox();
if (!box) throw new Error("canvas has no bounding box");
await page.mouse.move(box.x + box.width * 0.48, box.y + box.height * 0.48);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.38, { steps: 8 });
await page.mouse.up();
await page.mouse.down({ button: "right" });
await page.mouse.move(box.x + box.width * 0.56, box.y + box.height * 0.54, { steps: 6 });
await page.mouse.up({ button: "right" });
await page.mouse.wheel(0, -280);
const afterCamera = await page.locator("#scene").screenshot();
const afterInteraction = await page.evaluate(() => ({
  selected: document.querySelector("#space-select")?.value,
  mode: document.querySelector("#view-mode")?.value,
  interiorOnly: document.querySelector("#interior-only")?.checked,
  status: document.querySelector("#build-status")?.textContent,
  spaceTitle: document.querySelector("#space-title")?.textContent,
  topology: document.querySelector("#topology-stats")?.textContent?.replace(/\s+/g, " ").trim(),
}));
const screenshotPath = join(process.env.TEMP ?? "C:/Windows/Temp", "future-citizen-house-view.png");
await page.locator("#scene").screenshot({ path: screenshotPath });

await page.locator("#refresh-source").click();
await page.waitForFunction(() => document.querySelector("#build-status")?.textContent?.startsWith("rebuilt "));
const refreshStatus = await page.evaluate(() => document.querySelector("#build-status")?.textContent);
await page.reload({ waitUntil: "networkidle" });
await page.waitForFunction(() => document.querySelector("#build-status")?.textContent?.includes("built from current source"));
const afterReload = await page.evaluate(() => ({
  status: document.querySelector("#build-status")?.textContent,
  title: document.querySelector("#environment-title")?.textContent,
}));

console.log(JSON.stringify({
  RENDERER: "Canvas2D in Chromium channel",
  initial,
  beforeInteraction,
  afterInteraction,
  refreshStatus,
  afterReload,
  cameraChanged: !initialCanvas.equals(afterCamera),
  initialScreenshotPath,
  screenshotPath,
  consoleErrors,
  pageErrors,
}, null, 2));
await browser.close();
