import assert from "node:assert/strict";
import test from "node:test";

import { imbrexFootMargin } from "../imbrexFootMargin.mjs";
import { pinPlateRadialMargin } from "../pinPlateRadialMargin.mjs";
import { ridgeFootGap } from "../ridgeFootGap.mjs";
import { ridgeSectionAt } from "../ridgeSectionAt.mjs";
import { rollSheetGap } from "../rollSheetGap.mjs";
import { strapBattenVerticalMargin } from "../strapBattenVerticalMargin.mjs";

/** Metre-valued hand arithmetic, positive/negative twins and exact boundaries; no IO. */
const near = (actual: number, expected: number): void => {
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} differs from ${expected}`);
};

void test("plate radial intervals overlap, detach and just touch", () => {
  near(pinPlateRadialMargin(2, 0, 1, 2), 1);
  near(pinPlateRadialMargin(0.5, 0, 0.25, 2), -1.25);
  near(pinPlateRadialMargin(2, 0, 1, 3), 0);
});

void test("both tube feet fit their ribs, lose a band and reject zero inner radius", () => {
  near(imbrexFootMargin(2, 1, 0.5, [0.8, 1.7], [2.3, 3.2]), 0.2);
  near(imbrexFootMargin(2, 1, 0.5, [1, 1.5], [2.5, 3]), 0);
  near(imbrexFootMargin(2, 1, 0.5, [1, 1.5], [2.6, 2.9]), -0.1);
  assert.equal(imbrexFootMargin(2, 1, 1, [1, 1.5], [2.5, 3]), -Infinity);
});

void test("the 3-4-5 circle gives contact, clearance and penetration", () => {
  near(rollSheetGap(0, 0, 3, 4, 5), 0);
  near(rollSheetGap(0, 0, 3, 4, 4), 1);
  near(rollSheetGap(0, 0, 3, 4, 6), -1);
});

void test("a horizontal tile makes the datum clearance direct subtraction", () => {
  near(ridgeFootGap(2, 1, 3, 0), 1);
  near(ridgeFootGap(1, 1, 3, 0), 0);
  near(ridgeFootGap(0, 1, 3, 0), -1);
});

void test("shell sections preserve the arc, clip its inner edge and admit the outer foot", () => {
  const center = ridgeSectionAt(0, 5, 2, 1, 0, 0);
  near(center.tile, 1); near(center.lower, 3); near(center.upper, 5);
  const edge = ridgeSectionAt(0, 5, 2, 1, 0, 3);
  near(edge.lower, 1); near(edge.upper, 4);
  const foot = ridgeSectionAt(0, 5, 2, 1, 0, 4);
  near(foot.lower, 1); near(foot.upper, 3);
  const mirrored = ridgeSectionAt(0, 5, 2, 1, 0, -4);
  near(mirrored.tile, foot.tile); near(mirrored.lower, foot.lower); near(mirrored.upper, foot.upper);
  const outer = ridgeSectionAt(0, 5, 2, 0, 0, 5);
  near(outer.lower, 0); near(outer.upper, 0);
  assert.throws(() => ridgeSectionAt(0, 5, 5, 1, 0, 0), RangeError);
  assert.throws(() => ridgeSectionAt(0, 5, 2, 1, 0, 6), RangeError);
});

void test("strap and batten intervals overlap, touch and leave a gap", () => {
  near(strapBattenVerticalMargin(1, 2, 3, 2), 1);
  near(strapBattenVerticalMargin(1, 2, 4, 2), 0);
  near(strapBattenVerticalMargin(1, 2, 5, 2), -1);
});
