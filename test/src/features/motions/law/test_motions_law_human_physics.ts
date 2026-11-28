import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanPhysics
} from "../../../../../packages/motions/src/law/internal/HumanPhysics";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of a minimum-jerk share, units of weight. */
const ROUNDING: number = 1e-12;

/**
 * Check admission, envelope and support correction for a grounded law.
 *
 * Scenarios:
 *
 * 1. Use the law's recommended bounds with an explicit 0.5 request. Refuse
 *    missing bounds, invalid weight and a positive request on an immobile
 *    part. Admit zero there.
 * 2. Sample a weight of 0.8 over 1 to 3 s with half-second ramps, then
 *    restrict it to a narrower support phase.
 * 3. Project a centre against the 0.2 m square along the chosen direction.
 *    Compare an outside correction, an inside centre and a line that misses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the defaulted fields, timing and support footprint.
 * @evidence contracts/development/testing.md#behavioral-verification Shift, fixed, envelope and support-offset routines receive distinct small typed fixtures.
 * @evidence contracts/development/testing.md#independent-expectations Minimum-jerk symmetry gives half weight at each ramp midpoint. The square's edge at 0.1 m gives a 0.2 m correction from x = 0.3.
 */
export function test_motions_law_human_physics(): void {
  // 1. The request merged with the law's recommendation.
  const law: Parameters<typeof HumanPhysics.shift>[1] = {
    balance: { from: { event: "start" }, to: { event: "end" }, weight: 0.5 },
  };
  const shifted: ReturnType<typeof HumanPhysics.shift> = HumanPhysics.shift(
    { balance: { by: "hips" } },
    law,
  );
  TestValidator.predicate(
    "no request, no shift; the law's bounds and weight",
    HumanPhysics.shift({}, law) === null &&
      shifted !== null &&
      shifted.by === "hips" &&
      shifted.weight === 0.5 &&
      shifted.from.event === "start" &&
      shifted.ramp.in === 0,
  );

  // 2. Refusals.
  TestValidator.predicate(
    "an incomplete or out-of-range request, and a part the law cannot move",
    throwsError((): unknown =>
      HumanPhysics.shift({ balance: { by: "hips" } }),
    ) &&
      throwsError((): unknown =>
        HumanPhysics.shift({ balance: { by: "hips", weight: 1.5 } }, law),
      ) &&
      throwsError((): unknown =>
        HumanPhysics.fixed(
          { balance: { by: "trunk" } },
          "the pose is fixed",
          law,
        ),
      ) &&
      !throwsError((): unknown =>
        HumanPhysics.fixed(
          { balance: { by: "trunk", weight: 0 } },
          "the pose is fixed",
          law,
        ),
      ),
  );

  // 3. The window's weight.
  const window: NonNullable<HumanPhysics.Window> = {
    by: "hips",
    weight: 0.8,
    from: 1,
    to: 3,
    ramp: { in: 0.5, out: 0.5 },
  };
  const edge: number = 0.8 * AutoMovieEngineMotionSampling.minimumJerkShare(0.5);
  TestValidator.predicate(
    "eased over the ramps, none outside or off the phase",
    nclose(HumanPhysics.weightAt(window, 1.25), edge, ROUNDING) &&
      nclose(HumanPhysics.weightAt(window, 2.75), edge, ROUNDING) &&
      HumanPhysics.weightAt(window, 2) === 0.8 &&
      HumanPhysics.weightAt(window, 0.5) === 0 &&
      HumanPhysics.weightAt(window, 3.5) === 0 &&
      HumanPhysics.weightAt(HumanPhysics.during(window, 1.5, 2.5), 1.25) ===
        0 &&
      HumanPhysics.weightAt(HumanPhysics.during(window, 1.5, 2.5), 2) === 0.8,
  );

  // 4. The support offset.
  const square = (
    x: number,
    z: number,
  ): Parameters<typeof HumanPhysics.supportOffset>[0] => ({
    centre: { x, y: 0.9, z },
    points: [
      { x: -0.1, y: 0, z: -0.1 },
      { x: 0.1, y: 0, z: -0.1 },
      { x: 0.1, y: 0, z: 0.1 },
      { x: -0.1, y: 0, z: 0.1 },
    ],
  });
  const left: IAutoMovieVector3 = { x: -1, y: 0, z: 0 };
  TestValidator.predicate(
    "the least move onto the hull",
    nclose(HumanPhysics.supportOffset(square(0.3, 0), left)!, 0.2, ROUNDING) &&
      HumanPhysics.supportOffset(square(0, 0), left) === 0 &&
      HumanPhysics.supportOffset(square(0.3, 0.5), left) === null,
  );
}
