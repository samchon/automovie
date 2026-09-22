/**
 * Drive the shipped body editor page on a real GPU and capture a population
 * of documents from the canonical views, so the editor is judged by frames it
 * drew rather than by the tests that pinned its numbers.
 *
 * Usage, from the repository root, with a static server on 5188 (or `PORT`) serving
 * `packages/playground/dist` (`pnpm --filter @automovie/playground build`,
 * then `npx serve -l 5188 packages/playground/dist`):
 *
 *   node test/scripts/body-review/capture-editor.mjs <name> [state,...] [--no-face]
 *
 * Frames land in `.shots/body-review/editor-<name>/<state>-<view>-<mode>.png`
 * with a `renderer.json` naming the unmasked device; a software rasterizer
 * is a failure, not a frame. Each state is applied through the page's own
 * `__connectedBody.change`, the same transaction a slider commits, so the
 * frame shows what an author gets. The face toggle is the page's; the
 * default captures the seated face, `--no-face` hides it.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const noFace = args.includes("--no-face");
const positional = args.filter((arg) => !arg.startsWith("--"));
const [name, list] = positional;
assert(name, "name an output name");
const output = path.join(root, ".shots/body-review", "editor-" + name);
fs.mkdirSync(output, { recursive: true });

const joint = (bone, flexion, abduction = null, twist = null) => ({
  bone,
  flexion,
  abduction,
  twist,
});
const POPULATION = {
  neutral: {},
  female: { shape: { macroGender: -1 } },
  male: { shape: { macroGender: 1 } },
  child: { shape: { macroAge: -1 } },
  old: { shape: { macroAge: 1 } },
  heavy: { shape: { macroWeight: 1 } },
  thin: { shape: { macroWeight: -1 } },
  muscular: { shape: { macroMuscle: 1 } },
  "female-heavy": { shape: { macroGender: -1, macroWeight: 0.7 } },
  "male-muscular-tall": {
    shape: { macroGender: 1, macroMuscle: 0.8, macroHeight: 0.6 },
  },
  "wide-shoulders-narrow-hips": {
    shape: {
      measureShoulderDist: 1,
      torsoScaleHoriz: 0.5,
      hipScaleHoriz: -0.6,
    },
  },
  "thin-waist-wide-hips": {
    shape: { measureWaistCirc: -1, hipScaleHoriz: 0.8, measureHipsCirc: 0.6 },
  },
  "t-pose": {
    pose: [
      joint("leftUpperArm", null, 90),
      joint("rightUpperArm", null, 90),
      joint("leftLowerArm", 0),
      joint("rightLowerArm", 0),
    ],
  },
  "arms-down": {
    pose: [
      joint("leftUpperArm", null, 0),
      joint("rightUpperArm", null, 0),
      joint("leftLowerArm", 0),
      joint("rightLowerArm", 0),
    ],
  },
  "elbows-90": {
    pose: [joint("leftLowerArm", 90), joint("rightLowerArm", 90)],
  },
  "elbows-145": {
    pose: [joint("leftLowerArm", 145), joint("rightLowerArm", 145)],
  },
  squat: {
    pose: [
      joint("leftUpperLeg", 90),
      joint("rightUpperLeg", 90),
      joint("leftLowerLeg", 120),
      joint("rightLowerLeg", 120),
      joint("leftFoot", 20),
      joint("rightFoot", 20),
    ],
  },
  sitting: {
    pose: [
      joint("leftUpperLeg", 90),
      joint("rightUpperLeg", 90),
      joint("leftLowerLeg", 90),
      joint("rightLowerLeg", 90),
    ],
  },
  "arms-overhead": {
    pose: [joint("leftUpperArm", null, 170), joint("rightUpperArm", null, 170)],
  },
  "head-turn": {
    pose: [joint("neck", null, null, 30), joint("head", 10, null, 20)],
  },
  "female-sitting": {
    shape: { macroGender: -1 },
    pose: [
      joint("leftUpperLeg", 90),
      joint("rightUpperLeg", 90),
      joint("leftLowerLeg", 90),
      joint("rightLowerLeg", 90),
      joint("leftLowerArm", 90),
      joint("rightLowerArm", 90),
    ],
  },
};
const states = list === undefined ? Object.keys(POPULATION) : list.split(",");
const views = [
  ["front", 0],
  ["left-three-quarter", 45],
  ["left", 90],
  ["back", 180],
  ["right", -90],
];

const browser = await chromium.launch({ channel: "chromium", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1500, height: 1000 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(
    `http://127.0.0.1:${process.env.PORT ?? "5188"}/connected-body.html`,
    {
      timeout: 300000,
    },
  );
  await page.waitForFunction(
    () => window.__connectedBody?.snapshot()?.status === "ready",
    {},
    { timeout: 300000 },
  );
  const gpu = await page.evaluate(() => window.__connectedBody.renderer());
  console.log("RENDERER", gpu);
  assert(!/software|swiftshader|llvmpipe|warp|basic render/i.test(gpu), gpu);
  fs.writeFileSync(
    path.join(output, "renderer.json"),
    JSON.stringify(
      { device: gpu, captured: new Date().toISOString(), states },
      null,
      2,
    ) + "\n",
  );
  if (noFace) await page.locator("#face").uncheck();
  // let the companion face arrive before the first frame
  await page.waitForTimeout(3000);
  const base = await page.evaluate(() => window.__connectedBody.document());
  const canvas = page.locator("#body-canvas");
  for (const state of states) {
    const edit = POPULATION[state];
    assert(edit, "unknown state " + state);
    await page.evaluate((document) => window.__connectedBody.change(document), {
      ...base,
      id: state,
      name: state,
      shape: {},
      ...edit,
    });
    await page.waitForFunction(
      (id) => {
        const snapshot = window.__connectedBody.snapshot();
        return snapshot?.status === "ready" && snapshot.document.id === id;
      },
      state,
      { timeout: 300000 },
    );
    await page.waitForTimeout(400);
    for (const [view, degrees] of views)
      for (const clay of [false, true]) {
        await page.evaluate(
          ([d, c]) => {
            window.__connectedBody.clay(c);
            window.__connectedBody.camera(d);
            window.__connectedBody.finish();
          },
          [degrees, clay],
        );
        await canvas.screenshot({
          path: path.join(
            output,
            `${state}-${view}-${clay ? "clay" : "skin"}.png`,
          ),
        });
      }
    const snapshot = await page.evaluate(() => {
      const s = window.__connectedBody.snapshot();
      return {
        parts: s.model.parts,
        bytes: s.model.glb.byteLength,
        error: s.error ?? null,
      };
    });
    console.log("captured", state, snapshot);
  }
  assert.deepEqual(errors, [], "page errors: " + errors.join("\n"));
} finally {
  await browser.close();
}
