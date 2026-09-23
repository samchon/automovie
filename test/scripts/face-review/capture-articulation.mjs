/**
 * Render exported census models on a real GPU through the Playwright library
 * and write one PNG per view. Run from the test package:
 *
 *   node scripts/face-review/capture-articulation.mjs <census directory> <output directory> [view,view,...]
 *
 * The page is `web/articulation-viewer.html` over file://; Chromium is launched
 * with the real `chromium` channel so ANGLE reaches the device, and the
 * `RENDERER` string is logged and written into `captures.json` so a software
 * fallback cannot pass for a GPU frame. A JSON file in the input directory
 * that is not a model (an exporter's own record) is skipped. Views are front, left and right three
 * quarters, both profiles, back and a frontal clay; `mouth` is a close view
 * of the oral region and `eyes` of the orbits. The screenshot is the canvas
 * element after `gl.finish()`.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(pathToFileURL(path.resolve("node_modules/playwright/index.mjs")).href);
const [input, output, viewList] = process.argv.slice(2);
if (input === undefined || output === undefined) throw new Error("Supply the census directory and an output directory.");
const VIEWS = {
  front: { yaw: 0, pitch: 0 },
  "left-quarter": { yaw: 45, pitch: 0 },
  "right-quarter": { yaw: -45, pitch: 0 },
  left: { yaw: 90, pitch: 0 },
  right: { yaw: -90, pitch: 0 },
  back: { yaw: 180, pitch: 0 },
  clay: { yaw: 0, pitch: 0, clay: true },
  mouth: { yaw: 25, pitch: -8, clay: true, distance: 0.26, target: [0, -0.045, 0.1] },
  eyes: { yaw: 0, pitch: 5, clay: true, distance: 0.24, target: [0, 0.03, 0.12] },
};
const views = viewList === undefined ? Object.keys(VIEWS) : viewList.split(",");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  channel: "chromium",
  headless: true,
  args: ["--allow-file-access-from-files", "--use-gl=angle", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
page.on("pageerror", (error) => console.error("page error:", error.message));
await page.goto(pathToFileURL(path.resolve("scripts/face-review/web/articulation-viewer.html")).href);
await page.waitForFunction(() => typeof window.show === "function");
const renderer = await page.evaluate(() => window.RENDERER);
console.log("RENDERER:", renderer);
const captures = [];
for (const file of fs.readdirSync(input).filter((name) => name.endsWith(".json") && name !== "census.json").sort()) {
  const model = JSON.parse(fs.readFileSync(path.join(input, file), "utf8"));
  // The exporters write their own records beside the models; a file without
  // parts and materials is one of those, not something to render.
  if (!Array.isArray(model.parts) || !Array.isArray(model.materials)) continue;
  for (const view of views) {
    const options = VIEWS[view];
    if (options === undefined) throw new Error("Unknown view: " + view);
    const result = await page.evaluate(([model, options]) => window.show(model, options), [model, options]);
    const name = `${model.id}__${view}.png`;
    await page.locator("#view").screenshot({ path: path.join(output, name) });
    captures.push({ model: model.id, view, parts: result.parts, file: name });
    console.log(name, "parts", result.parts);
  }
}
fs.writeFileSync(path.join(output, "captures.json"), JSON.stringify({ renderer, captures }, null, 2) + "\n");
await browser.close();
