/**
 * Render exported census models on a real GPU through the Playwright library
 * and write one PNG per view. Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/capture-articulation.ts CENSUS OUTPUT [view,view,...] [pose-file.json]
 *
 * CENSUS holds the models `export-subject-views.ts` and
 * `export-articulation-census.ts` write. The page is `web/articulation-viewer.html`,
 * served by a vite server this run starts on a free loopback port and closes
 * before it returns; Chromium is launched with the real `chromium` channel so
 * ANGLE reaches the device. The `RENDERER` string is judged before any frame
 * is drawn (a software rasterizer refuses the run), logged and written into
 * `captures.json` so a fallback cannot pass for a GPU frame.
 *
 * `front-hair-mask` renders the exact visible numerical-hair parts as white
 * over black, preserving their fibre alpha and the other parts' depth
 * occlusion for photo-silhouette comparisons. An optional pose file maps model
 * ids to estimated {yaw, pitch} angles and optional fixed camera
 * distance/target for a whole-hair frame and vertical field of view (degrees,
 * 28 when omitted); `reference-yaw` and `reference-yaw-hair-mask` use that same
 * per-model camera. This runner records an estimate, not recovered physical
 * intrinsics. A JSON file without model parts and materials is skipped.
 * Views include front, both three-quarters, both profiles, back and frontal
 * clay; `mouth` is a close view of the oral region and `eyes` of the orbits, and
 * `eyes-normal` and `eyes-normal-quarter` draw the same orbits as shading normals.
 * The screenshot is the canvas element after `gl.finish()`.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { judgeViewerRenderer } from "../human-viewer/judgeViewerRenderer";
import type {
  IPortraitWebModel,
  IPortraitWebOptions,
} from "./web/IPortraitWebModel";
import {
  type IPortraitWebPose,
  portraitWebCapturePose,
} from "./web/portraitWebCapturePose";

const VIEWS: Record<string, IPortraitWebOptions> = {
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
  "eyes-normal": {
    yaw: 0,
    pitch: 5,
    normal: true,
    distance: 0.24,
    target: [0, 0.03, 0.12],
  },
  "eyes-normal-quarter": {
    yaw: 35,
    pitch: 3,
    normal: true,
    distance: 0.16,
    target: [0.03, 0.03, 0.11],
  },
  eyes: {
    yaw: 0,
    pitch: 5,
    clay: true,
    distance: 0.24,
    target: [0, 0.03, 0.12],
  },
};

async function main(): Promise<void> {
  const [input, output, viewList, poseFile] = process.argv.slice(2);
  if (input === undefined || output === undefined)
    throw new Error("Supply the census directory and an output directory.");
  const views =
    viewList === undefined ? Object.keys(VIEWS) : viewList.split(",");
  const poseBytes = poseFile === undefined ? null : fs.readFileSync(poseFile);
  const poses = (
    poseBytes === null ? null : JSON.parse(poseBytes.toString("utf8"))
  ) as Record<string, IPortraitWebPose | null> | null;
  fs.mkdirSync(output, { recursive: true });
  const { createServer } = await import("vite");
  const server = await createServer({
    configFile: false,
    root: path.resolve(__dirname, "web"),
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0 },
  });
  await server.listen();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    channel: "chromium",
    headless: true,
    args: ["--use-gl=angle", "--ignore-gpu-blocklist"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 900, height: 900 },
    });
    page.on("pageerror", (error) =>
      console.error("page error:", error.message),
    );
    await page.goto(`${server.resolvedUrls!.local[0]}articulation-viewer.html`);
    await page.waitForFunction(() => typeof window.show === "function");
    const renderer = await page.evaluate(() => window.RENDERER);
    console.log("RENDERER:", renderer);
    const verdict = judgeViewerRenderer(renderer);
    if (!verdict.real) throw new Error(verdict.reason);
    const captures: Record<string, unknown>[] = [];
    for (const file of fs
      .readdirSync(input)
      .filter((name) => name.endsWith(".json") && name !== "census.json")
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
      const model = JSON.parse(
        fs.readFileSync(path.join(input, file), "utf8"),
      ) as IPortraitWebModel;
      // The exporters write their own records beside the models; a file
      // without parts and materials is one of those, not something to render.
      if (!Array.isArray(model.parts) || !Array.isArray(model.materials))
        continue;
      for (const view of views) {
        const options =
          view === "reference-yaw" || view === "reference-yaw-hair-mask"
            ? portraitWebCapturePose(
                poses,
                model.id,
                view.endsWith("hair-mask"),
              )
            : VIEWS[view];
        if (options === undefined) throw new Error("Unknown view: " + view);
        const result = await page.evaluate(
          ([shown, shownOptions]) => window.show(shown, shownOptions),
          [model, options] as const,
        );
        const name = `${model.id}__${view}.png`;
        await page
          .locator("#view")
          .screenshot({ path: path.join(output, name) });
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
  } finally {
    await browser.close();
    await server.close();
  }
}
void main();
