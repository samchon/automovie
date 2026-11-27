import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanPhysics } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of a minimum-jerk share, units of weight. */
const ROUNDING: number = 1e-12;

/**
 * `HumanPhysics` is the balance correction a grounded law may supply: `shift`
 * takes each field of the caller's request where given, else the law's own
 * recommendation, weight 1 and no ramps by default, and refuses a request
 * without a part or bounds or with a weight outside [0, 1]; `fixed` refuses a
 * positive request to a law that cannot move that part; a resolved window's
 * weight rises and falls over its ramps on the minimum-jerk share and is none
 * outside it or its support phase (`weightAt`), and `during` limits it to a
 * phase; `supportOffset` is the least move along a direction that brings the
 * centre onto its support hull.
 *
 * Scenarios:
 *
 * 1. No request is no shift; a request of the hips over a law recommending its
 *    bounds and a weight of 0.5 takes the law's bounds and weight.
 * 2. A request with no bounds anywhere, or a weight of 1.5, is refused; a law that
 *    cannot move the part refuses a positive weight and accepts zero.
 * 3. A window over 1 to 3 s at weight 0.8 with half-second ramps weighs 0.8 s(½)
 *    at 1.25 and 2.75 s, 0.8 in between and none outside; limited to the phase
 *    1.5 to 2.5 s, none at 1.25 s.
 * 4. Against the 0.2 m square about the origin, a centre at (0.3, 0) moves 0.2 m
 *    along −X, one inside moves none, and one whose line misses the square has
 *    no move.
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
