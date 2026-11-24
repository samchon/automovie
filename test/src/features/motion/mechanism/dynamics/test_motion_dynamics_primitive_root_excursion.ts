import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanRoot,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";
import { vclose } from "../../../internal/vclose";

/**
 * Root excursion returns a signed displacement to its entry height.
 *
 * Scenarios:
 *
 * 1. Read entry, full excursion and exit on a vertical quarter-metre dip.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Root excursion returns a signed displacement to its entry height.
 * @evidence contracts/development/testing.md#independent-expectations The authored negative displacement applies only at the envelope peak.
 * @evidence contracts/development/testing.md#distinguishing-cases Both endpoints rejoin the entry root.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_primitive_root_excursion(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const base: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 2, y: 0, z: 3 }, 90);
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(2, [
    { name: "peak", seconds: 1 },
  ]);
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.excursion(
      clock,
      ["start", "peak"],
      ["peak", "end"],
      { point: { x: 0, y: -0.25, z: 0 }, yaw: 0 },
    );
  for (const [t, dy] of [
    [0, 0],
    [1, -0.25],
    [2, 0],
  ] as const) {
    TestValidator.predicate(
      "vertical excursion",
      vclose(primitive.write(base, t).root, {
        ...base.root,
        y: base.root.y + dy,
      }),
    );
  }
}
