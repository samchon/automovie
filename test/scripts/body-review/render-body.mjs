/**
 * Capture every state of a built set from the canonical views on a real GPU.
 *
 * Usage, from the repository root, after `build-body.ts` wrote the set:
 *
 *   node test/scripts/body-review/render-body.mjs <set> [state,...] [--joints]
 *
 * Frames land in `.shots/body-review/<set>/frames/<state>-<view>-<mode>.png`
 * with a `renderer.json` naming the unmasked device. A software rasterizer
 * (SwiftShader, llvmpipe, WARP, Basic Render Driver) is a failure, not a
 * frame: the harness asks Playwright for the real Chromium channel and refuses
 * to record a capture whose device string reads like one, because the whole
 * point of the sheet is to see what the GPU draws.
 *
 * The page is served by a small allowlisted HTTP server on 127.0.0.1 because
 * Chromium refuses ES module imports over `file://`. Three.js comes from the
 * test workspace's own installation; the data directory is the set's own.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const joints = args.includes("--joints");
const positional = args.filter((arg) => !arg.startsWith("--"));
const set = positional[0];
if (set === undefined) throw new Error("name the built set to render");
const setDir = path.join(root, ".shots/body-review", set);
const states =
  positional[1] === undefined
    ? fs
        .readdirSync(setDir)
        .filter((file) => file.endsWith(".json") && file !== "channel-measurements.json")
        .map((file) => file.slice(0, -5))
        .sort()
    : positional[1].split(",");
const frames = path.join(setDir, "frames");
fs.mkdirSync(frames, { recursive: true });

const files = {
  "/": [path.join(here, "web/index.html"), "text/html; charset=utf-8"],
  "/app.mjs": [path.join(here, "web/app.mjs"), "text/javascript"],
  "/three.module.js": [
    path.join(root, "test/node_modules/three/build/three.module.js"),
    "text/javascript",
  ],
  "/three.core.js": [
    path.join(root, "test/node_modules/three/build/three.core.js"),
    "text/javascript",
  ],
};
const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  let entry = files[url.pathname];
  if (entry === undefined && url.pathname.startsWith("/data/")) {
    const name = path.basename(url.pathname);
    if (states.includes(name.slice(0, -5)))
      entry = [path.join(setDir, name), "application/json"];
  }
  if (entry === undefined) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": entry[1] });
  fs.createReadStream(entry[0]).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;

const { chromium } = await import(
  pathToFileURL(path.join(root, "test/node_modules/playwright/index.mjs")).href
);
const browser = await chromium.launch({ channel: "chromium", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  let device = "unknown";
  page.on("console", (message) => {
    const text = message.text();
    if (text.startsWith("RENDERER ")) device = text.slice("RENDERER ".length);
  });
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForFunction(() => window.__bodyReview !== undefined);
  if (/swiftshader|llvmpipe|softpipe|software|basic render|warp|unknown/i.test(device))
    throw new Error("Software rasterizer refused: " + device);
  fs.writeFileSync(
    path.join(frames, "renderer.json"),
    JSON.stringify({ device, captured: new Date().toISOString(), states }, null, 2) + "\n",
  );
  console.log("RENDERER", device);
  const views = ["front", "left-three-quarter", "left", "back", "right"];
  for (const state of states) {
    await page.evaluate((name) => window.__bodyReview.load(name), state);
    for (const view of views)
      for (const mode of ["skin", "clay"]) {
        await page.evaluate(
          ([v, m, j]) => window.__bodyReview.view(v, m, j),
          [view, mode, joints],
        );
        await page.locator("canvas").screenshot({
          path: path.join(frames, `${state}-${view}-${mode}.png`),
        });
      }
    console.log("captured", state);
  }
} finally {
  await browser.close();
  server.close();
}
