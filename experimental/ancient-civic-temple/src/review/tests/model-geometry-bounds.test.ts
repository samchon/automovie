import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { modelGeometryFailures } from "../model-geometry-bounds.mjs";

const source = (file: string): string => readFileSync(join(__dirname, "../../../docs/models", `${file}.md`), "utf8");

void test("geometry bounds read every defining input in the review mutations", () => {
  assert.deepEqual(modelGeometryFailures(source), []);
  const mutations: [string, string, string, string][] = [
    ["fixtures", "중심선 반지름 0.11m의 낮은 파문", "중심선 반지름 0.08m의 낮은 파문", "fountain ripple"],
    ["entablature", "+Z로 0.08m 돌출하는 띠다", "+Z로 0.30m 돌출하는 띠다", "porch cornice"],
    ["fixtures", "몸체는 폭 1.10m·깊이 0.36m", "몸체는 폭 1.10m·깊이 0.50m", "niche body"],
    ["wares", "바깥 돌출은 0.004m, 높이 범위", "바깥 돌출은 0.04m, 높이 범위", "basket slat"],
    ["fixtures", "Y=0.35m와 0.80m", "Y=0.35m와 1.30m", "lamp stem"],
    ["fixtures", "Y=0.10m·0.55m·1.00m·1.37m", "Y=0.10m·0.55m·1.00m·1.50m", "display shelf"],
    ["wares", "말린 끝은 X축 반지름 0.02m", "말린 끝은 X축 반지름 0.03m", "open scroll"],
    ["cladding", "겹침 코는 바깥 반지름 0.15m", "겹침 코는 바깥 반지름 0.25m", "east ridge"],
    ["openings", "X=+0.021m·Z=0m이며", "X=+0.00m·Z=0m이며", "double hinge"],
    ["openings", "Z=−0.068~+0.031m", "Z=−0.080~+0.031m", "single hinge"],
  ];
  for (const [file, before, after, expected] of mutations) {
    assert.ok(source(file).includes(before), `${file}: mutation input exists`);
    const failures = modelGeometryFailures((name: string) => name === file ? source(name).replace(before, after) : source(name));
    assert.ok(failures.some((failure: string) => failure.includes(expected)), `${file}: ${expected}: ${failures.join("; ")}`);
  }
});
