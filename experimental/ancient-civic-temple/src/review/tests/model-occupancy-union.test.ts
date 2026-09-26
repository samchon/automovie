import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { modelParts, occupancyUnionRows } from "../model-occupancy-union.mjs";
import { modelSections } from "../model-tessellation-census.mjs";

const root = join(__dirname, "../../../docs/models");
const body = (file: string, id: string): string => {
  const section = modelSections(readFileSync(join(root, file + ".md"), "utf8"))
    .find((row: { id: string }) => row.id === id);
  assert.ok(section);
  return section.body;
};
const failed = (source: string) => occupancyUnionRows("mutant", source)
  .filter((row: { pass: boolean }) => !row.pass);

void test("every recoverable authored part remains in its stated occupancy box", () => {
  let rows = 0;
  for (const file of readdirSync(root).filter((name) => name.endsWith(".md"))) {
    for (const section of modelSections(readFileSync(join(root, file), "utf8"))) {
      const checked = occupancyUnionRows(file + "#" + section.id, section.body);
      rows += checked.length;
      assert.deepEqual(checked.filter((row: { pass: boolean }) => !row.pass), []);
      if (/점유 상자는/.test(section.body) && modelParts(section.body).length)
        assert.ok(checked.length, `${file}#${section.id} skipped its occupancy box`);
      if (checked.length) {
        for (const { key } of modelParts(section.body)) for (const axis of ["X", "Y", "Z"])
          assert.ok(checked.some((row: { part: string; axis: string; kind: string }) =>
            row.part === key && row.axis === axis && row.kind === "containment"),
          `${file}#${section.id} ${key} ${axis} is unmeasured`);
        for (const axis of ["X", "Y", "Z"])
          assert.ok(checked.some((row: { part: string; axis: string; kind: string }) =>
            row.part === "all" && row.axis === axis && row.kind === "union"),
          `${file}#${section.id} ${axis} union is unmeasured`);
      }
    }
  }
  assert.ok(rows > 150);
});

void test("numeric boxes across the corpus reject an independently changed axis", () => {
  let checked = 0;
  for (const file of readdirSync(root).filter((name) => name.endsWith(".md")))
    for (const section of modelSections(readFileSync(join(root, file), "utf8"))) {
      const box = section.body.match(/점유 상자는 (\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)m/);
      if (!box) continue;
      for (let axis = 1; axis <= 3; axis++) {
        const changed = [...box];
        changed[axis] = String(Number(box[axis]) + 0.037);
        const source = section.body.replace(box[0], `점유 상자는 ${changed.slice(1).join("×")}m`);
        assert.ok(failed(source).some((row: { kind: string; axis: string }) =>
          row.kind === "union" && row.axis === ["X", "Y", "Z"][axis - 1]),
        `${file}#${section.id} changed box axis ${axis} escaped`);
        checked++;
      }
    }
  assert.ok(checked > 0);
});

void test("cart Z union derives from its centreline without summary intervals", () => {
  const source = body("portable", "handcart")
    .replace("지지재는 Z=0.08~0.12m다. ", "")
    .replace("손잡이는 Z=−1.20~−0.65m다. ", "");
  assert.deepEqual(failed(source), []);
  const wrong = source.replace("0.76×0.72×1.80m다.", "0.76×0.72×1.82m다.");
  assert.ok(failed(wrong).some((row: { axis: string, kind: string }) =>
    row.axis === "Z" && row.kind === "union"));
});

void test("part containment still checks a partially recoverable H2", () => {
  const source = "막대는 X=−0.30~0.30m다. 알 수 없는 두 번째 부재다. 점유 상자는 0.50×0.20×0.20m다.\n부재 대응: `bar`=막대; `unknown`=두 번째 부재.";
  assert.ok(failed(source).some((row: { part: string, kind: string }) =>
    row.part === "bar" && row.kind === "containment"));
});
