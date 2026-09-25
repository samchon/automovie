/**
 * Render exported census models on a real GPU through the Playwright library
 * and write one PNG per view. Run from the test package:
 *
 *   node scripts/face-review/capture-articulation.mjs <census directory> <output directory> [view,view,...] [pose-file.json]
 *
 * The page is `web/articulation-viewer.html` over file://; Chromium is launched
 * with the real `chromium` channel so ANGLE reaches the device, and the
 * `RENDERER` string is logged and written into `captures.json` so a software
 * fallback cannot pass for a GPU frame. `front-hair-mask` renders the exact
 * visible numerical-hair parts as white over black, preserving their fibre
 * alpha and the other parts' depth occlusion for photo-silhouette comparisons.
 * An optional pose file maps model IDs to estimated {yaw,pitch} angles and
 * optional fixed camera distance/target for a whole-hair frame and vertical
 * field of view (degrees, 28 when omitted);
 * `reference-yaw` and `reference-yaw-hair-mask` use that same per-model camera.
 * This runner records an estimate, not recovered physical intrinsics.
 * A JSON file without model parts and materials is skipped. Views include front,
 * both three-quarters, both profiles, back and frontal clay; `mouth` is a close view
 * of the oral region and `eyes` of the orbits. The screenshot is the canvas
 * element after `gl.finish()`.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { portraitWebCapturePose } from "./web/logic.mjs";

const { chromium } = await import(
  pathToFileURL(path.resolve("node_modules/playwright/index.mjs")).href
);
const [input, output, viewList, poseFile] = process.argv.slice(2);
if (input === undefined || output === undefined)
  throw new Error("Supply the census directory and an output directory.");
const VIEWS = {
  front: { yaw: 0, pitch: 0 },
  "front-hair-mask": { yaw: 0, pitch: 0, hairMask: true },
  "left-quarter": { yaw: 45, pitch: 0 },
  "front-high": { yaw: 0, pitch: 20 },
  "right-quarter": { yaw: -45, pitch: 0 },
  left: { yaw: 90, pitch: 0 },
  right: { yaw: -90, pitch: 0 },
  back: { yaw: 180, pitch: 0 },
  clay: { yaw: 0, pitch: 0, clay: true },
  mouth: {
    yaw: 25,
    pitch: -8,
    clay: true,
    distance: 0.26,
    target: [0, -0.045, 0.1],
  },
  eyes: {
    yaw: 0,
    pitch: 5,
    clay: true,
    distance: 0.24,
    target: [0, 0.03, 0.12],
  },
};
const views = viewList === undefined ? Object.keys(VIEWS) : viewList.split(",");
const poseBytes = poseFile === undefined ? null : fs.readFileSync(poseFile);
const poses =
  poseBytes === null ? null : JSON.parse(poseBytes.toString("utf8"));
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  channel: "chromium",
  headless: true,
  args: [
    "--allow-file-access-from-files",
    "--use-gl=angle",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
page.on("pageerror", (error) => console.error("page error:", error.message));
await page.goto(
  pathToFileURL(
    path.resolve("scripts/face-review/web/articulation-viewer.html"),
  ).href,
);
await page.waitForFunction(() => typeof window.show === "function");
const renderer = await page.evaluate(() => window.RENDERER);
console.log("RENDERER:", renderer);
const captures = [];
for (const file of fs
  .readdirSync(input)
  .filter((name) => name.endsWith(".json") && name !== "census.json")
  .sort()) {
  const model = JSON.parse(fs.readFileSync(path.join(input, file), "utf8"));
  // The exporters write their own records beside the models; a file without
  // parts and materials is one of those, not something to render.
  if (!Array.isArray(model.parts) || !Array.isArray(model.materials)) continue;
  for (const view of views) {
    const options =
      view === "reference-yaw" || view === "reference-yaw-hair-mask"
        ? portraitWebCapturePose(poses, model.id, view.endsWith("hair-mask"))
        : VIEWS[view];
    if (options === undefined) throw new Error("Unknown view: " + view);
    const result = await page.evaluate(
      ([model, options]) => window.show(model, options),
      [model, options],
    );
    const name = `${model.id}__${view}.png`;
    await page.locator("#view").screenshot({ path: path.join(output, name) });
    captures.push({
      model: model.id,
      view,
      parts: result.parts,
      file: name,
      camera: {
        yaw: options.yaw,
        pitch: options.pitch,
        distance: options.distance ?? 0.62,
        fov: options.fov ?? 28,
        target: options.target ?? [0, 0, 0.06],
      },
    });
    console.log(name, "parts", result.parts);
  }
}
fs.writeFileSync(
  path.join(output, "captures.json"),
  JSON.stringify(
    {
      renderer,
      poseFileSha256:
        poseBytes === null
          ? null
          : createHash("sha256").update(poseBytes).digest("hex"),
      captures,
    },
    null,
    2,
  ) + "\n",
);
await browser.close();
