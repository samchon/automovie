/** Capture every subject four ways, so the render can be counted rather than looked at.
 *
 * Usage, from the repository root:
 *   node test/scripts/face-review/capture-render-census.mjs <name> [subject,...]
 *
 * Fixing what the eye happens to notice is not a method: it finds defects in the
 * order they are ugly, and it never says when the list ends. So each subject is
 * rendered in four states through the shipped editor, and every state differs
 * from another in exactly one thing.
 *
 * The clay toggle puts one uniform material over the whole scene and changes
 * nothing else -- same camera, same lights, same geometry, same document. So a
 * textured frame is shading times albedo and its clay frame is shading times a
 * constant, and dividing one by the other cancels the light and leaves the
 * albedo as the viewer actually receives it. An edge in that quotient is an
 * albedo edge by construction, whatever made it: a UV seam, the boundary where
 * observation stops and reconstruction begins, a block left by the fill, or a
 * garment painted onto a chest.
 *
 * The same toggle gives a hair mask that owes nothing to hair colour. Dressed
 * clay and bald clay differ exactly where the groom put geometry, so a black
 * lock against dark hair and a fair lock against a pale scalp are measured the
 * same way.
 *
 * Requires the static server on 5187 serving packages/playground/dist.
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const root = path.resolve(".shots/human-2469/investigation-2498");
const published =
  "test/studies/human-face/connected-basis/global-face/subjects.json";
const [name, list] = process.argv.slice(2);
assert(name, "name an output name");
const output = `${root}/census-${name}`;
fs.mkdirSync(output, { recursive: true });
const documents = JSON.parse(fs.readFileSync(published, "utf8"));
const subjects =
  list === undefined
    ? documents.map((one) => one.id.replace("-connected", ""))
    : list.split(",");
const views = [
  ["front", 0],
  ["left-three-quarter", 45],
  ["left", 90],
  ["back", 180],
];
const states = [
  ["bald-lit", { hair: false, clay: false }],
  ["bald-clay", { hair: false, clay: true }],
  ["dressed-lit", { hair: true, clay: false }],
  ["dressed-clay", { hair: true, clay: true }],
];

const browser = await chromium.launch({ channel: "chromium", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1610, height: 1000 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("http://127.0.0.1:5187/connected-face.html", {
    timeout: 180000,
  });
  await page.waitForFunction(
    () => window.__connectedFace?.snapshot()?.status === "ready",
    {},
    { timeout: 180000 },
  );
  const gpu = await page.evaluate(() => window.__connectedFace.renderer());
  console.log("RENDERER", gpu);
  assert(!/software|swiftshader|llvmpipe|warp/i.test(gpu), gpu);
  await page.evaluate(() => {
    document.querySelector("details").open = true;
  });
  const clay = page.locator("#clay");
  for (const subject of subjects) {
    const source = documents.find(
      (entry) => entry.id === `${subject}-connected`,
    );
    assert(source, subject);
    // The frame is set once, on the dressed state, and then left alone. Fitting
    // per state would frame a bald head and a dressed one differently, and the
    // hair mask is the difference between two frames: reframe between them and
    // the mask is the reframing.
    let framed = false;
    for (const [state, { hair, clay: bare }] of states) {
      const document = hair ? source : { ...source, hair: undefined };
      await page.locator("#document-json").fill(JSON.stringify(document));
      await page.locator("#document-apply").click();
      await page.waitForFunction(
        (id) => {
          const snapshot = window.__connectedFace?.snapshot();
          return snapshot?.status === "ready" && snapshot.document.id === id;
        },
        document.id,
        { timeout: 180000 },
      );
      if ((await clay.isChecked()) !== bare) await clay.setChecked(bare);
      if (framed === false) {
        await page.locator("#fit-view").click();
        framed = true;
      }
      for (const [view, yaw] of views) {
        await page.evaluate((y) => window.__connectedFace.camera(y), yaw);
        await page.evaluate(() => window.__connectedFace.finish());
        await page
          .locator("#face-canvas")
          .screenshot({ path: `${output}/${subject}-${state}-${view}.png` });
      }
    }
    console.log(`${subject} captured in ${states.length} states`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
