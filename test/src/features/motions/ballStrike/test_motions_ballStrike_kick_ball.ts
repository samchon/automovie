import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFoot, kickBall } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { nclose } from "../../internal/nclose";

/**
 * `kickBall.contact` places the kicking foot on the ball: its toes' joint, the
 * middle of the instep, at the back of the ball along the kick at the centre's
 * height, the foot heading along the kick and plantarflexed `kickBall.POINT`
 * (50) degrees so the instep faces the ball (Lees and Nolan 1998).
 *
 * The right ankle rests 0.08 m up and the toes' joint 0.15 m ahead of it and
 * 0.06 m below; a 0.11 m ball lies centred at (0.2, 0.11, 1).
 *
 * Scenarios:
 *
 * 1. Kicked along +Z the toes' joint meets (0.2, 0.11, 0.89): the ankle stands the
 *    rest ankle-to-toes distance from it, above it.
 * 2. The foot heads along the kick and points 50 degrees down.
 * 3. Kicked along +X the foot heads 90 degrees about +Y.
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
