import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRoot,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import { AutoMovieMotionHumanRoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { vclose } from "../../../features/internal/vclose";

/**
 * The root carries timed forward travel into the current body frame.
 *
 * Scenarios:
 * 1. Compare the same quadratic forward offset in zero and quarter-turn headings.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The root carries timed forward travel into the current body frame.
 * @evidence contracts/development/testing.md#independent-expectations One second produces one metre and two seconds four metres along the local forward axis.
 * @evidence contracts/development/testing.md#distinguishing-cases A quarter turn redirects forward travel into world X.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_gait_primitive_root_travel(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");

  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.travel({
      from: 0,
      to: 2,
      offset: (t: number): IAutoMovieMotionHumanRoot.IOffset => ({
        point: { x: 0, y: 0, z: t * t },
        yaw: 0,
      }),
    });
  for (const yaw of [0, 90]) {
    const base: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanStance.stand.posture(body, { x: 2, y: 0, z: 3 }, yaw);
    for (const t of [0, 1, 2]) {
      const out: IAutoMovieMotionHumanPosture = primitive.write(base, t);
      TestValidator.predicate(
        "world displacement",
        vclose(out.root, {
          x: base.root.x + (yaw === 90 ? t * t : 0),
          y: base.root.y,
          z: base.root.z + (yaw === 0 ? t * t : 0),
        }),
      );
    }
  }
}
