/** Pure contact fixtures include the reviewer-selected mutations and edge cases. */
import assert from "node:assert/strict";
import test from "node:test";
import { imbrexFootMargin, pinPlateRadialMargin, ridgeFootGap, rollSheetGap, strapBattenVerticalMargin } from "../model-contact-math.mjs";

void test("plate and pin have positive radial overlap; a shrunken plate is detached", () => {
  assert.ok(pinPlateRadialMargin(0.06, 1.05, 0.006, 1.104) > 0);
  assert.ok(pinPlateRadialMargin(0.02, 1.05, 0.006, 1.104) < 0);
  assert.ok(Math.abs(pinPlateRadialMargin(0.054, 1.05, 0, 1.104)) < 1e-10);
});

void test("both imbrex tube feet stand within a raised rib; enlarged tube fails", () => {
  const ribs: [[number, number], [number, number]] = [[0.10, 0.20], [0.20, 0.30]];
  assert.ok(imbrexFootMargin(0.20, 0.085, 0.015, ...ribs) > 0);
  assert.ok(imbrexFootMargin(0.20, 0.20, 0.015, ...ribs) < 0);
  assert.equal(imbrexFootMargin(0.20, 0.015, 0.015, ...ribs), -Infinity);
});

void test("rolled paper meets its top corner, and an offset roll has a gap", () => {
  const rollZ = 0.175 + Math.sqrt(0.02 ** 2 - 0.018 ** 2);
  assert.ok(Math.abs(rollSheetGap(0.002, 0.175, 0.02, rollZ, 0.02)) < 1e-10);
  assert.ok(rollSheetGap(0.002, 0.175, 0.02, rollZ + 0.01, 0.02) > 0);
});

void test("ridge foot datum follows the actual tile top on both pitches", () => {
  for (const angle of [19, 22]) {
    const a = angle * Math.PI / 180;
    const datum = 0.02 / Math.cos(a) - 0.13 * Math.tan(a);
    assert.ok(Math.abs(ridgeFootGap(datum, 0.02, 0.13, angle)) < 1e-10);
    assert.ok(ridgeFootGap(datum + 0.025, 0.02, 0.13, angle) > 0);
  }
});

void test("steel straps overlap wooden battens through their full height", () => {
  assert.ok(strapBattenVerticalMargin(0.25, 0.12, 0.31, 0.04) > 0);
  assert.ok(Math.abs(strapBattenVerticalMargin(0.25, 0.12, 0.39, 0.04)) < 1e-10);
  assert.ok(strapBattenVerticalMargin(0.25, 0.12, 0.41, 0.04) < 0);
});
