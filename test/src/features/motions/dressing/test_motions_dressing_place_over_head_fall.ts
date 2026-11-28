import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  placeOverHeadPath
} from "../../../../../packages/motions/src/dressing/internal/placeOverHeadPath";
import { strict as assert } from "node:assert";

import { nclose } from "../../internal/nclose";

/** One degree of bracketing refined by 40 halvings, plus arithmetic rounding. */
const ANGLE_ROUNDING_DEGREES: number = 2e-12;

/** The radius and arc products each contribute rounding of a few ulps. */
const ARC_ROUNDING_METRES: number = 4 * Number.EPSILON;

/**
 * Check over-head terminal angle and continuous approach clearance.
 *
 * Scenarios:
 *
 * 1. A constant 10 mm gap admits the full 60 degree fall. A varying gap caps
 *    it at 35.5 degrees, and a constant 9 mm gap admits no angle.
 * 2. Measure a quarter-circle arc around the worn axis and check the
 *    zero-angle result.
 * 3. Admit a safe sweep and a stationary threshold contact. Reject an 8 mm
 *    interior gap even though the distant samples clear 10 mm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases give the angular boundary and identify the continuous gap missed by endpoints.
 * @evidence contracts/development/testing.md#behavioral-verification The actual angle, arc and clearance routines receive explicit scalar distance functions and offsets.
 * @evidence contracts/development/testing.md#independent-expectations The line `45.5 - degrees` in millimetres crosses 10 at 35.5 degrees. A 0.3 m radius gives the quarter arc `0.15 * pi`.
 */
export function test_motions_dressing_place_over_head_fall(): void {
  assert.equal(
    placeOverHeadPath.settledFall(60, () => 0.01),
    60,
  );
  const gap = (degrees: number): number =>
    Math.min(0.025, 0.0455 - 0.001 * degrees);
  const angle: number | undefined = placeOverHeadPath.settledFall(60, gap);
  assert(angle !== undefined && gap(angle) >= 0.01);
  assert(nclose(angle, 35.5, ANGLE_ROUNDING_DEGREES));
  assert.equal(
    placeOverHeadPath.settledFall(60, () => 0.009),
    undefined,
  );

  const front: IAutoMovieVector3 = { x: 0.17, y: 0.18, z: 0.24 };
  const wear: IAutoMovieVector3 = { x: -0.43, y: 0, z: 0 };
  // The in-plane radius is 0.3 m from the 3-4-5 triangle. The axial offset
  // does not turn, so a quarter circle travels 0.15π metres.
  assert(
    nclose(
      placeOverHeadPath.fallArc(front, wear, 90),
      0.15 * Math.PI,
      ARC_ROUNDING_METRES,
    ),
  );
  assert.equal(placeOverHeadPath.fallArc(front, wear, 0), 0);

  // The distance to a plane can have a minimum at one quarter progress.
  // Its change is bounded by the 40 mm path length per unit progress.
  const travel: number = 0.04;
  const sweep =
    (offset: number) =>
    (progress: number): number =>
      offset + travel * Math.abs(progress - 0.25);
  assert(placeOverHeadPath.clearsSweep(sweep(0.012), travel, 0.01));
  assert(sweep(0.008)(0) > 0.01 && sweep(0.008)(0.5) > 0.01);
  assert(!placeOverHeadPath.clearsSweep(sweep(0.008), travel, 0.01));
  assert(placeOverHeadPath.clearsSweep(() => 0.01, 0, 0.01));
}
