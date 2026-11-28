import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFoot
} from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import {
  kickBall
} from "../../../../../packages/motions/src/ballStrike/internal/kickBall";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { nclose } from "../../internal/nclose";

/**
 * Check the contact goals for two kick directions.
 *
 * Scenarios:
 *
 * 1. For a 0.11 m ball and a +Z kick, place the toe joint at the back of the
 *    ball at (0.2, 0.11, 0.89) m, with the ankle above by the measured rest
 *    geometry.
 * 2. Read heading zero and the prescribed foot pitch, then change the kick to
 *    +X and read heading 90 degrees.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify the ball centre, foot reference and two directions.
 * @evidence contracts/development/testing.md#behavioral-verification The contact reader takes measured foot joints and the typed ball fixture to produce points and orientation.
 * @evidence contracts/development/testing.md#independent-expectations Subtracting one radius gives the contact point. The ankle-to-toe distance follows the rest measurements.
 */
export async function test_motions_ballStrike_kick_ball(): Promise<void> {
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map([
    ["rightFoot", { x: -0.1, y: 0.08, z: 0 }],
    ["rightToes", { x: -0.1, y: 0.02, z: 0.15 }],
  ]);
  const body: Parameters<typeof kickBall.contact>[0] = {
    rest,
    surfaces: (await humanFixture("m-average")).surfaces,
  };
  const centre: IAutoMovieVector3 = { x: 0.2, y: 0.11, z: 1 };
  const hit: IAutoMovieMotionHumanFoot.IPlacement = kickBall.contact(
    body,
    "right",
    centre,
    0.11,
    { x: 0, y: 0, z: 1 },
  );
  const at: IAutoMovieVector3 = { x: 0.2, y: 0.11, z: 0.89 };

  // 1. The toes' joint on the ball's back.
  TestValidator.predicate(
    "the ankle a rigid foot from the ball's back",
    nclose(
      Math.hypot(hit.ankle.x - at.x, hit.ankle.y - at.y, hit.ankle.z - at.z),
      Math.hypot(0.06, 0.15),
      1e-9,
    ) && hit.ankle.y > at.y,
  );

  // 2. Heading and pointing.
  TestValidator.predicate(
    "along the kick, pointed",
    nclose(HumanFoot.heading(hit.rotation), 0, 1e-9) &&
      nclose(HumanFoot.pitch(hit.rotation), -kickBall.POINT, 1e-9),
  );

  // 3. Another direction.
  TestValidator.predicate(
    "a kick along +X",
    nclose(
      HumanFoot.heading(
        kickBall.contact(body, "right", centre, 0.11, { x: 1, y: 0, z: 0 })
          .rotation,
      ),
      90,
      1e-9,
    ),
  );
}
