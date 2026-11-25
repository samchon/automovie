import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of one quaternion rotation and a difference, metres or degrees. */
const ROUNDING: number = 1e-9;

/** Where the forefoot is planted, world metres. */
const ANCHOR: IAutoMovieVector3 = { x: 1, y: 0, z: 2 };

/** The ball of the foot in the foot's frame, metres. */
const BALL: IAutoMovieVector3 = { x: 0, y: -0.07, z: 0.14 };

/**
 * The support transfer of a heel-off: `HumanFoot.heelOff` places the ankle so
 * the forefoot contact stays on its anchor under the pitch the foot reached,
 * `anchor − R_reached · contact`, and gives the toes the pitch the foot was
 * asked for but did not reach, `max(0, pitch asked − pitch reached)`, so the
 * toes keep the floor; `HumanFoot.pivot` turns a placed foot rigidly about its
 * ball, so the ball stays and the heel rises on a circle about it.
 *
 * The body is built whole (`humanFixtureBody`): the pivot reads its sole
 * sockets.
 *
 * Scenarios:
 *
 * 1. Asked 0 and reaching −15 degrees, asked −10 and reaching −25, and asked 0 and
 *    reaching 5, each at headings 0 and 40: the toes take 15, 15 and 0 degrees,
 *    and the ball lies on the anchor.
 * 2. The left foot pivoted about its ball at the anchor, flat and then pitched −20
 *    degrees: the ball stays on the anchor, the heel rises, and its distance
 *    from the anchor in the sagittal plane is unchanged.
 */
export async function test_motions_posture_foot_heel_off(): Promise<void> {
  // 1. The heel-off.
  const cases: readonly (readonly [number, number, number])[] = [
    [0, -15, 15],
    [-10, -25, 15],
    [0, 5, 0],
  ];
  TestValidator.predicate(
    "the toes take the lost pitch and the ball stays",
    cases.every(
      ([ask, reached, toes]: readonly [number, number, number]): boolean =>
        [0, 40].every((yaw: number): boolean => {
          const actual: IAutoMovieQuaternion = HumanFoot.rotation(yaw, reached);
          const off: IAutoMovieMotionHumanFoot.IHeelOffResult =
            HumanFoot.heelOff(
              HumanFoot.rotation(yaw, ask),
              actual,
              ANCHOR,
              BALL,
            );
          return (
            nclose(off.toes, toes, ROUNDING) &&
            vclose(
              Vector3.add(off.ankle, Quaternion.rotateVector(actual, BALL)),
              ANCHOR,
              ROUNDING,
            )
          );
        }),
    ),
  );

  // 2. The pivot about the ball.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const flat: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
    body,
    "left",
    "ball",
    ANCHOR,
    0,
    0,
  );
  const rocked: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
    body,
    "left",
    "ball",
    ANCHOR,
    0,
    -20,
  );
  const before: IAutoMovieVector3 = HumanFoot.point(body, "left", "heel", flat);
  const after: IAutoMovieVector3 = HumanFoot.point(
    body,
    "left",
    "heel",
    rocked,
  );
  TestValidator.predicate(
    "the ball stays and the heel rises on its circle",
    vclose(HumanFoot.point(body, "left", "ball", rocked), ANCHOR, ROUNDING) &&
      after.y > before.y &&
      nclose(
        Math.hypot(before.y - ANCHOR.y, before.z - ANCHOR.z),
        Math.hypot(after.y - ANCHOR.y, after.z - ANCHOR.z),
        ROUNDING,
      ),
  );
}
