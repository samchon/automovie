/**
 * Render published face documents through the product face editor on a real
 * GPU and write one PNG per document at its measured camera. Run from the
 * test package with the playground dev server up
 * (`pnpm --filter @automovie/playground dev`):
 *
 *   node scripts/face-review/capture-editor-views.mjs <study directory> <output directory> <pose-file.json> [base URL]
 *
 * `capture-articulation.mjs` draws exported meshes with its own lights and
 * materials, which is enough for geometry (landmarks, hair silhouettes) but
 * not for appearance: the editor shows the same builder output through its
 * own stage (ACES tone mapping, a key, fill and rim with soft shadows, a
 * hemisphere), transmissive optics and alpha-to-coverage cut-outs. This
 * runner shows each document the way an author does, by writing it into the
 * editor's document field and applying it, then places the display camera
 * with `window.__connectedFace.look` at the pose file's yaw, pitch, distance,
 * target and field of view (28 degrees when omitted), exactly as
 * `capture-articulation.mjs` places its own, and reads the canvas pixels after
 * `finish`. The study directory holds `basis.json.gz` and `subjects.json`:
 * the editor's request for its basis is answered with this study's file, so
 * a candidate study renders without replacing the published one, and the
 * dev server's own answer for that request (its index page, because the asset
 * lies outside the playground root) is never read. The editor's control map
 * and study list stay the published ones, so a candidate basis must keep the
 * published basis identity. The canvas is 900 by 900 pixels at device
 * pixel ratio 1. The `RENDERER` string is logged and written into
 * `captures.json` beside each camera, in the format the measurement reads,
 * with the view named `reference-yaw`.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  pathToFileURL(path.resolve("node_modules/playwright/index.mjs")).href
);
const [study, output, poseFile, base = "http://127.0.0.1:5173"] =
  process.argv.slice(2);
if (study === undefined || output === undefined || poseFile === undefined)
  throw new Error(
    "Supply a study directory, an output directory and a pose file.",
  );
const documents = JSON.parse(
  fs.readFileSync(path.join(study, "subjects.json"), "utf8"),
);
const basisBytes = fs.readFileSync(path.join(study, "basis.json.gz"));
const poseBytes = fs.readFileSync(poseFile);
const poses = JSON.parse(poseBytes.toString("utf8"));
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  channel: "chromium",
  headless: true,
  args: ["--use-gl=angle", "--ignore-gpu-blocklist"],
});
// The editor's grid gives the canvas section all width but the 410-pixel
// panel, so this viewport leaves a 900-pixel square canvas.
const page = await browser.newPage({
  viewport: { width: 1310, height: 900 },
  deviceScaleFactor: 1,
});
page.on("pageerror", (error) => console.error("page error:", error.message));
await page.route("**/basis.json.gz", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/gzip",
    body: basisBytes,
  }),
);
await page.goto(`${base}/connected-face.html`);
await page.waitForFunction(
  () =>
    window.__connectedFace !== undefined &&
    document.querySelector("#face-status")?.dataset.state === "ready",
  undefined,
  { timeout: 600_000 },
);
const renderer = await page.evaluate(() => window.__connectedFace.renderer());
console.log("RENDERER:", renderer);
const captures = [];
for (const document_ of documents) {
  const subject = document_.id.replace(/-connected$/u, "");
  const pose = poses[subject];
  if (pose === undefined) continue;
  // The document field sits in a collapsed panel section; writing it and
  // pressing Apply from script runs the same handler an author's click does.
  await page.evaluate((text) => {
    document.querySelector("#document-json").value = text;
    document.querySelector("#document-apply").click();
  }, JSON.stringify(document_));
  await page.waitForFunction(
    (id) => {
      const status = document.querySelector("#face-status");
      return (
        status?.dataset.state !== "building" &&
        window.__connectedFace.document()?.id === id
      );
    },
    document_.id,
    { timeout: 600_000 },
  );
  const state = await page.evaluate(
    () => document.querySelector("#face-status").dataset.state,
  );
  if (state === "error")
    throw new Error(`${subject}: ${await page.textContent("#face-status")}`);
  const target = pose.target ?? [0, 0, 0.06];
  const distance = pose.distance ?? 0.62;
  const yaw = ((pose.yaw ?? 0) * Math.PI) / 180;
  const pitch = ((pose.pitch ?? 0) * Math.PI) / 180;
  const camera = {
    position: [
      target[0] + distance * Math.sin(yaw) * Math.cos(pitch),
      target[1] + distance * Math.sin(pitch),
      target[2] + distance * Math.cos(yaw) * Math.cos(pitch),
    ],
    target,
    fov: pose.fov ?? 28,
  };
  const size = await page.evaluate((view) => {
    window.__connectedFace.look(view);
    window.__connectedFace.finish();
    const canvas = document.querySelector("#face-canvas");
    return [canvas.width, canvas.height];
  }, camera);
  if (size[0] !== 900 || size[1] !== 900)
    throw new Error(`The editor canvas is ${size.join("x")}, not 900x900.`);
  const url = await page.evaluate(() =>
    document.querySelector("#face-canvas").toDataURL("image/png"),
  );
  const file = `${subject}__reference-yaw.png`;
  fs.writeFileSync(
    path.join(output, file),
    Buffer.from(url.slice(url.indexOf(",") + 1), "base64"),
  );
  captures.push({
    model: subject,
    view: "reference-yaw",
    file,
    camera: {
      yaw: pose.yaw ?? 0,
      pitch: pose.pitch ?? 0,
      distance,
      target,
      ...(pose.fov === undefined ? {} : { fov: pose.fov }),
    },
  });
  console.log(subject, "captured");
}
await browser.close();
fs.writeFileSync(
  path.join(output, "captures.json"),
  JSON.stringify(
    {
      renderer,
      poseFileSha256: createHash("sha256").update(poseBytes).digest("hex"),
      captures,
    },
    null,
    2,
  ) + "\n",
);
