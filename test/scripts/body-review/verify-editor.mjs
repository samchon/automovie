/**
 * Exercise the shipped body editor's transactions on a real GPU: an edit,
 * undo, redo, reset, a document applied from the text area, a document
 * loaded from a file, a contact check, and the exported GLB written to disk
 * for `verify-editor-export.ts` to compare byte for byte with the package's
 * own export of the same document.
 *
 * Usage, from the repository root, with a static server on 5188 (or `PORT`)
 * serving `packages/playground/dist`:
 *
 *   node test/scripts/body-review/verify-editor.mjs
 *
 * Every step asserts on the page's own snapshot, so a green run means the
 * editor did what its controls say. Output lands in
 * `.shots/body-review/editor-verify/`.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const output = path.join(root, ".shots/body-review/editor-verify");
fs.mkdirSync(output, { recursive: true });

const browser = await chromium.launch({ channel: "chromium", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1500, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(
    `http://127.0.0.1:${process.env.PORT ?? "5188"}/connected-body.html`,
    {
      timeout: 300000,
    },
  );
  // `condition` is a JavaScript expression over the ready snapshot `s`
  const ready = (condition = "true") =>
    page.waitForFunction(
      `(() => { const s = window.__connectedBody?.snapshot(); return s?.status === "ready" && (${condition}); })()`,
      {},
      { timeout: 300000 },
    );
  await ready();
  // one value, one change event, one transaction (fill's own event dispatch
  // differs by input type, so the number is set the way a keyboard commit is)
  const set = (selector, value) =>
    page.evaluate(
      ([s, v]) => {
        const input = document.querySelector(s);
        input.value = v;
        input.dispatchEvent(new Event("change"));
      },
      [selector, value],
    );
  const gpu = await page.evaluate(() => window.__connectedBody.renderer());
  console.log("RENDERER", gpu);
  assert(!/software|swiftshader|llvmpipe|warp|basic render/i.test(gpu), gpu);
  const snapshot = () =>
    page.evaluate(() => {
      const s = window.__connectedBody.snapshot();
      return {
        id: s.document.id,
        shape: s.document.shape,
        pose: s.document.pose ?? [],
        canUndo: s.canUndo,
        canRedo: s.canRedo,
        status: s.status,
        error: s.error ?? null,
      };
    });
  const initial = await snapshot();
  console.log("initial", initial);
  assert.equal(initial.canUndo, false);

  // 1. an edit through a slider's number input commits a transaction
  await page.selectOption("#control-kind", "macro");
  await set("#control-macroGender", "-1");
  await ready("s.document.shape.macroGender === -1");
  let state = await snapshot();
  assert.equal(state.shape.macroGender, -1);
  assert.equal(state.canUndo, true);
  console.log("edit committed", state.shape);

  // 2. undo restores the neutral, redo brings the edit back
  await page.click("#body-undo");
  await ready("s.document.shape.macroGender === undefined");
  state = await snapshot();
  assert.equal(state.shape.macroGender, undefined);
  assert.equal(state.canRedo, true);
  await page.click("#body-redo");
  await ready("s.document.shape.macroGender === -1");
  state = await snapshot();
  assert.equal(state.shape.macroGender, -1);
  console.log("undo and redo agree");

  // 3. a joint edit in clinical degrees through the pose controls
  await page.selectOption("#control-kind", "pose");
  await page.selectOption("#pose-bone", "leftLowerArm");
  await set("#pose-leftLowerArm-flexion", "90");
  await ready(
    '(s.document.pose ?? []).some((j) => j.bone === "leftLowerArm" && j.flexion === 90)',
  );
  state = await snapshot();
  assert.deepEqual(state.pose, [
    { bone: "leftLowerArm", flexion: 90, abduction: null, twist: null },
  ]);
  console.log("pose committed", state.pose);

  // 4. an out-of-range pose is refused and the last valid state stays
  await set("#pose-leftLowerArm-flexion", "170");
  await page.waitForFunction(
    () => window.__connectedBody.snapshot()?.status === "error",
    {},
    { timeout: 300000 },
  );
  state = await snapshot();
  assert.equal(state.status, "error");
  assert.match(state.error, /clinical ranges|violates/);
  assert.deepEqual(state.pose, [
    { bone: "leftLowerArm", flexion: 90, abduction: null, twist: null },
  ]);
  console.log("refused as expected:", state.error.slice(0, 80));

  // 5. the complete document round-trips through the text area
  await page.evaluate(() => {
    document.querySelector("details").open = true;
  });
  const text = await page.inputValue("#document-json");
  const parsed = JSON.parse(text);
  parsed.id = "roundtrip";
  parsed.shape.macroWeight = 0.5;
  await page.fill("#document-json", JSON.stringify(parsed));
  await page.click("#document-apply");
  await ready('s.document.id === "roundtrip"');
  state = await snapshot();
  assert.equal(state.shape.macroWeight, 0.5);
  assert.equal(state.shape.macroGender, -1);
  console.log("document applied", state.id, state.shape);

  // 6. a document loaded from a file
  const file = path.join(output, "loaded.json");
  fs.writeFileSync(
    file,
    JSON.stringify({
      ...parsed,
      id: "loaded",
      shape: { macroAge: 1 },
      pose: [],
    }),
  );
  await page.setInputFiles("#body-file", file);
  await ready('s.document.id === "loaded"');
  state = await snapshot();
  assert.deepEqual(state.shape, { macroAge: 1 });
  console.log("document loaded", state.id);

  // 7. the contact check reads the census instrument
  await page.evaluate(() =>
    window.__connectedBody.change({
      id: "contact",
      name: "contact",
      basis: window.__connectedBody.document().basis,
      shape: {},
      pose: [
        { bone: "leftLowerArm", flexion: 145, abduction: null, twist: null },
      ],
    }),
  );
  await ready('s.document.id === "contact"');
  await page.click("#body-contacts");
  await page.waitForFunction(
    () =>
      /^(Crossing segments|No skin segment)/.test(
        document.querySelector("#body-status").textContent,
      ),
    {},
    { timeout: 300000 },
  );
  const contacts = await page.textContent("#body-status");
  console.log("contacts:", contacts.trim().slice(0, 200));
  assert.match(contacts, /leftUpperArm x leftLowerArm|No skin segment/);

  // 8. reset returns to the initial document; the GLB goes to disk
  await page.click("#body-reset");
  await ready('s.document.id === "connected-body"');
  const glb = await page.evaluate(() =>
    Array.from(window.__connectedBody.snapshot().model.glb),
  );
  fs.writeFileSync(path.join(output, "editor.glb"), Buffer.from(glb));
  fs.writeFileSync(
    path.join(output, "editor-document.json"),
    JSON.stringify(
      await page.evaluate(() => window.__connectedBody.document()),
    ),
  );
  console.log("reset; GLB", glb.length, "bytes written");
  assert.deepEqual(errors, [], "page errors: " + errors.join("\n"));
  console.log("editor verified");
} finally {
  await browser.close();
}
