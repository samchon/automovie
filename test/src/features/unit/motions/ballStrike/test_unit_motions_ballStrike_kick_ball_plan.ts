import type {
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKickBall,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionPropLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";
import { kickBall } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** A football's grip: its centre at its frame, 0.22 m across. */
const GRIP: IAutoMovieAffordance = {
  id: "grip",
  kind: "handle",
  frame: {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
  aperture: 0.22,
};

/** A football resting with its centre at a point. */
const ball = (centre: IAutoMovieVector3): IAutoMovieMotionHumanProp => ({
  subject: "ball",
  frame: { position: centre, rotation: { x: 0, y: 0, z: 0, w: 1 } },
  points: {},
  affordances: [GRIP],
});

/**
 * `kickBall.plan` kicks the ball beside the support foot with the instep: a
 * phrase of 0.35 s preparation, a 0.1 s attack to the `stroke`, 0.15 s follow
 * and 0.45 s retract; at the stroke the kicking foot stands on the contact
 * placement `kickBall.contact` gives for the ball's own centre and radius, and
 * with a speed the ball launches at the stroke along the kick.
 *
 * The average man stands at the origin facing +Z; a 0.11 m ball rests at
 * (-0.1, 0.11, 0.35), ahead of his right foot.
 *
 * Scenarios:
 *
 * 1. The plan lasts 1.05 s with its stroke at 0.45 s.
 * 2. At the stroke the right leg's goal is the contact placement's ankle.
 * 3. Kicked at 12 m/s with a 3 m/s lift, the ball launches at the stroke at
 *    (0, 3, 12) m/s.
 * 4. A ball 2 m ahead lies beyond the leg and is refused.
 */
export async function test_unit_motions_ballStrike_kick_ball_plan(): Promise<void> {
  // Whole body: the kick stands the body, reads its hips and solves its leg
  // phrase over the full rig.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const centre: IAutoMovieVector3 = { x: -0.1, y: 0.11, z: 0.35 };
  const context = (
    params: IAutoMovieMotionHumanKickBall.IParams,
    at: IAutoMovieVector3 = centre,
  ): IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKickBall.IParams> =>
    motionActionContext(body, params, { props: [ball(at)] });
  const plan: IAutoMovieMotionHumanActionPlan = kickBall.plan(
    context({ ball: "ball" }),
  );
  const stroke: number =
    plan.duration *
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === "stroke")!
      .share;

  // 1. Timing.
  TestValidator.predicate(
    "the phrase",
    nclose(plan.duration, 1.05, 1e-9) && nclose(stroke, 0.45, 1e-9),
  );

  // 2. The foot on the ball.
  TestValidator.predicate(
    "the contact placement at the stroke",
    vclose(
      plan.posture(stroke).limbs.rightLeg!.point,
      kickBall.contact(body, "right", centre, 0.11, { x: 0, y: 0, z: 1 }).ankle,
      1e-9,
    ),
  );

  // 3. The launch.
  const launch: IAutoMovieMotionPropLaunch = kickBall.plan(
    context({ ball: "ball", speed: 12, lift: 3 }),
  ).launches![0]!;
  TestValidator.predicate(
    "the ball launched along the kick",
    launch.prop === "ball" &&
      nclose(launch.seconds, 0.45, 1e-9) &&
      vclose(launch.velocity, { x: 0, y: 3, z: 12 }, 1e-9),
  );

  // 4. Out of reach.
  TestValidator.predicate(
    "beyond the leg",
    throwsError(() =>
      kickBall.plan(context({ ball: "ball" }, { x: -0.1, y: 0.11, z: 2 })),
    ),
  );
}
