import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { modelSections } from "../model-tessellation-census.mjs";
import { insertionWitnessMargins } from "../model-insertion-witness.mjs";

const section = (file: string, anchor: string): string => {
  const source = readFileSync(join(__dirname, "../../../docs/models", `${file}.md`), "utf8");
  return modelSections(source).find((item: { id: string }) => item.id === anchor)!.body;
};

const cases = [
  ["fixtures", "lampstand", "stem/knop", "중심 Y=0.35m와 0.80m", "중심 Y=1.20m와 1.30m"],
  ["landscape", "cypress", "trunk/crown", "원뿔대(높이 1.4m)", "원뿔대(높이 1.2m)"],
  ["landscape", "broad-tree", "trunk/branch", "줄기 중심 (0,1.5,0)m", "줄기 중심 (0,1.6,0)m"],
  ["landscape", "broad-tree", "branch/crown", "(-1.05,2.6,-0.55)m", "(-5.05,2.6,-0.55)m"],
  ["portable", "handcart", "axle/wheel", "축은 X=−0.34~0.34m", "축은 X=−0.30~0.30m"],
  ["portable", "bucket", "body/handle", "(0.1475 cos t,0.27+0.17 sin t,0)m", "(0.1700 cos t,0.27+0.17 sin t,0)m"],
  ["wares", "storage-jar", "body/handle", "(±0.20,0.58,0)m", "(±0.24,0.58,0)m"],
] as const;

for (const [file, anchor, pair, before, after] of cases) {
  void test(`${anchor} ${pair} has a section witness and refuses a boundary or separation`, () => {
    const body = section(file, anchor);
    assert.ok(body.includes(before));
    const actual = insertionWitnessMargins(pair, body);
    assert.ok(actual?.every((margin) => margin > 0));
    const altered = insertionWitnessMargins(pair, body.replace(before, after));
    assert.ok(altered?.some((margin) => margin <= 0));
  });
}

void test("an unparsed inserted pair has no implicit box permission", () => {
  assert.equal(insertionWitnessMargins("new/assembly", "두 부재가 겹쳐 고정된다."), null);
});

void test("a torus inside the vessel mouth does not count as clay penetration", () => {
  const body = section("wares", "storage-jar");
  const inner = "(0.70,0.08)→(0.64,0.055)→(0.55,0.04)m의 직선 연결 뒤 Y=0.55m";
  assert.ok(body.includes(inner));
  const widened = body.replace(inner,
    "(0.70,0.30)→(0.64,0.30)→(0.50,0.30)m의 직선 연결 뒤 Y=0.50m");
  assert.ok(insertionWitnessMargins("body/handle", body)?.every((margin) => margin > 0));
  assert.ok(insertionWitnessMargins("body/handle", widened)?.every((margin) => margin < 0));
});
