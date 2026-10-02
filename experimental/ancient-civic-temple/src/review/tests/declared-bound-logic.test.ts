import assert from "node:assert/strict";
import test from "node:test";

import { declaredBoundRows } from "../declaredBoundRows.mjs";

/** Immutable metre-valued paragraphs exercise the occupancy comparison itself.
 * Independent width/depth/height values pin the X/Z/Y permutation, containment,
 * equality and ambiguous-input limits without filesystem or census execution.
 */
void test("whole-object dimensions match X/Z/Y and reject each adjacent axis mismatch", () => {
  const rows = declaredBoundRows("whole", "폭 4m·깊이 6m·높이 5m. 점유 상자는 4×5×6m.");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].pass, true);
  for (const declaration of ["폭 3m·깊이 6m·높이 5m", "폭 4m·깊이 3m·높이 5m", "폭 4m·깊이 6m·높이 3m"])
    assert.equal(declaredBoundRows("different", `${declaration}. 점유 상자는 4×5×6m.`)[0].pass, false);
  assert.deepEqual(declaredBoundRows("none", "폭 4m·깊이 6m·높이 5m."), []);
  assert.deepEqual(declaredBoundRows("ambiguous", "점유 상자는 4×5×6m. 점유 상자는 8×9×10m."), []);
});

void test("component dimensions require containment on every axis and admit exact boundaries", () => {
  for (const declaration of ["몸체는 폭 4m·깊이 6m·높이 5m", "받침은 폭 1m·깊이 2m·높이 3m"])
    assert.equal(declaredBoundRows("contained", `${declaration}. 점유 상자는 4×5×6m.`)[0].pass, true);
  for (const declaration of ["몸체는 폭 5m·깊이 6m·높이 5m", "몸체는 폭 4m·깊이 7m·높이 5m", "몸체는 폭 4m·깊이 6m·높이 6m"])
    assert.equal(declaredBoundRows("excess", `${declaration}. 점유 상자는 4×5×6m.`)[0].pass, false);
  const multiple = declaredBoundRows("many", "폭 1m·깊이 2m·높이 3m. 폭 2m·깊이 3m·높이 4m. 점유 상자는 4×5×6m.");
  assert.deepEqual(multiple.map((row) => row.pass), [true, true]);
});

void test("radial shells fit both horizontal extents and their full height", () => {
  assert.equal(declaredBoundRows("shell", "지름 4m·높이 5m 껍질. 점유 상자는 4×5×6m.")[0].pass, true);
  for (const box of ["3×5×6", "4×5×3", "4×4×6"])
    assert.equal(declaredBoundRows("shell-excess", `지름 4m·높이 5m 껍질. 점유 상자는 ${box}m.`)[0].pass, false);
  const last = declaredBoundRows("top", "전체 높이 4m. 수관 꼭대기 5m. 점유 상자는 4×5×6m.");
  assert.equal(last.length, 1);
  assert.equal(last[0].pass, true);
  assert.equal(declaredBoundRows("top-excess", "전체 높이 6m. 점유 상자는 4×5×6m.")[0].pass, false);
});

void test("directed local axes compare with the matching box extent", () => {
  const rows = declaredBoundRows("axes", "X=-2~2m Y=5~0m Z=-3~3m. 점유 상자는 4×5×6m.");
  assert.deepEqual(rows.map((row) => row.pass), [true, true, true]);
  for (const interval of ["X=-2~3m", "Y=0~6m", "Z=-3~4m"])
    assert.equal(declaredBoundRows("axis-excess", `${interval}. 점유 상자는 4×5×6m.`)[0].pass, false);
});

void test("shelf clear width and two panel thicknesses reconcile across paragraphs", () => {
  const body = "측판 두께 0.5m\n\n측판 X=−1.5~+1.5m. 점유 상자는 4×3×2m.";
  const rows = declaredBoundRows("shelf", body);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].kind, "paired side panels and clear shelf");
  assert.equal(rows[1].pass, true);
  const asymmetric = declaredBoundRows("offset", "측판 두께 0.5m X=−1.5~+1.4m. 점유 상자는 4×3×2m.");
  assert.equal(asymmetric[1].pass, false);
  const excess = declaredBoundRows("panel-excess", "측판 두께 0.6m X=−1.5~+1.5m. 점유 상자는 4×3×2m.");
  assert.equal(excess[1].pass, false);
  const withoutThickness = declaredBoundRows("no-thickness", "측판 X=−1.5~+1.5m. 점유 상자는 4×3×2m.");
  assert.equal(withoutThickness.length, 1);
  const withoutRange = declaredBoundRows("no-range", "측판 두께 0.5m. 점유 상자는 4×3×2m.");
  assert.deepEqual(withoutRange, []);
});
