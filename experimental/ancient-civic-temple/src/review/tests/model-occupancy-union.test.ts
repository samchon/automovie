import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { occupancyUnionRows } from "../model-occupancy-union.mjs";
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
    }
  }
  assert.ok(rows > 150);
});

void test("transplanted box and geometry defects fail by computed part bounds", () => {
  const cases: Array<[string, string, string, string, string]> = [
    ["portable", "bench", "X=±(W/2−0.17)m", "X=±(W/2−0.02)m", "pier"],
    ["ritual", "jar-stand", "반지름 0.30→0.29m", "반지름 0.35→0.29m", "foot"],
    ["portable", "votive-plaque", "0.36×0.42×0.14m", "0.36×0.44×0.14m", "all"],
    ["ritual", "censer", "0.22×0.35×0.22m", "0.26×0.35×0.26m", "all"],
    ["portable", "bucket", "0.315×0.45×0.30m", "0.30×0.45×0.30m", "handle"],
    ["portable", "handcart", "0.76×0.72×1.80m다.", "0.80×0.72×1.80m다.", "all"],
    ["portable", "handcart", "(0.70,−1.20)m까지", "(0.70,−1.30)m까지", "handle"],
    ["portable", "handcart", "(±0.24,0.10)m, X·Z", "(±0.24,0.30)m, X·Z", "support"],
    ["portable", "rope-coil", "0.226×0.024×0.226m", "0.25×0.024×0.25m", "all"],
  ];
  for (const [file, id, before, after, expectedPart] of cases) {
    const source = body(file, id);
    assert.ok(source.includes(before), id + ": mutation site");
    assert.ok(failed(source.replace(before, after)).some((row: { part: string }) => row.part === expectedPart),
      file + "#" + id + " " + expectedPart);
  }
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
