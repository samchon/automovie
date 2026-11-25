import type { IAutoMovieMotionClock, IAutoMovieMotionHumanProp, IAutoMovieMotionHumanPropReader, IAutoMovieMotionManner, IAutoMoviePhysicalShape, IAutoMovieRigidTransform } from "@automovie/interface";
import { AutoMovieMotionManner, ballCourtClock, ballCourtHand, ballCourtSphere } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** A basketball's 0.12 m sphere collider, its centre 1 cm above the origin. */
const SPHERE: IAutoMoviePhysicalShape = {
  id: "ball",
  material: "rubber",
  transform: {
    position: { x: 0, y: 0.01, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  },
  kind: "sphere",
  radius: 0.12,
};

/** A court ball with its colliders and body. */
const ball = (
  more: Partial<IAutoMovieMotionHumanProp> = {},
): IAutoMovieMotionHumanProp => ({
  subject: "ball",
  frame: {
    position: { x: 0, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  },
  points: {},
  shapes: [SPHERE],
  ...more,
});

/** A context whose right hand holds what is given, reading the one ball. */
const context = (
  prop: IAutoMovieMotionHumanProp,
  right: string | undefined,
): Parameters<typeof ballCourtSphere>[0] => ({
  prop: (): IAutoMovieMotionHumanPropReader => ({
    prop,
    frame: (): IAutoMovieRigidTransform => prop.frame,
  }),
  entry: { holds: right === undefined ? {} : { right } },
});

/**
 * The court ball law's own logic: its phrase clock, its hands' targets and the
 * ball it releases.
 *
 * Scenarios:
 *
 * 1. A chest pass (0.37 s, 0.24 s) releases at 0.61 s, holds its finish 0.85 s and
 *    ends at 2.02 s; a contest holds 0.24 s; twice as slow, the pass releases
 *    at 1.22 s and still holds 0.85 s.
 * 2. A right-hand chest pass in arm lengths (0.6 m) from the shoulders' midpoint
 *    ends on the 0.12 m ball's side 0.84 arms ahead, pushing forward, and a set
 *    shot's left hand releases 0.85 arms up with the palm turned up.
 * 3. The held ball releases its 0.12 m sphere about its 1 cm offset, with no
 *    tangential loss when it has restitution and no friction; an unheld or a
 *    fixed ball is refused.
 */
export function test_motions_sport_ball_court(): void {
  // 1. The clock.
  const slow: IAutoMovieMotionManner.IModifiers = {
    ...AutoMovieMotionManner.NEUTRAL,
    tempo: 2,
  };
  const pass: IAutoMovieMotionClock = ballCourtClock(
    { prepare: 0.37, attack: 0.24 },
    false,
    AutoMovieMotionManner.NEUTRAL,
  );
  const contest: IAutoMovieMotionClock = ballCourtClock(
    { prepare: 0.34, attack: 0.55 },
    true,
    AutoMovieMotionManner.NEUTRAL,
  );
  const late: IAutoMovieMotionClock = ballCourtClock(
    { prepare: 0.37, attack: 0.24 },
    false,
    slow,
  );
  TestValidator.predicate(
    "the phrase clock",
    nclose(pass.at("stroke"), 0.61, 1e-12) &&
      nclose(pass.at("relax") - pass.at("strokeEnd"), 0.85, 1e-12) &&
      nclose(pass.duration, 2.02, 1e-12) &&
      nclose(contest.at("relax") - contest.at("strokeEnd"), 0.24, 1e-12) &&
      nclose(late.at("stroke"), 1.22, 1e-12) &&
      nclose(late.at("relax") - late.at("strokeEnd"), 0.85, 1e-12),
  );

  // 2. The hands.
  const push: ballCourtHand.ITarget = ballCourtHand(
    "chestPass",
    "right",
    1,
    1,
    0.2,
    0.6,
    0.12,
  );
  const shot: ballCourtHand.ITarget = ballCourtHand(
    "setShot",
    "left",
    1,
    0,
    0.2,
    0.6,
    0.12,
  );
  TestValidator.predicate(
    "the hands' targets",
    vclose(push.offset, { x: -(0.12 + 0.036), y: -0.15, z: 0.504 }, 1e-12) &&
      vclose(push.facing, { x: 1, y: 0, z: 1 }, 1e-12) &&
      vclose(shot.offset, { x: 0.12, y: 0.51, z: 0.252 }, 1e-12) &&
      vclose(shot.facing, { x: 0, y: 1, z: 0.4 }, 1e-12),
  );

  // 3. The released ball.
  TestValidator.equals(
    "the held ball's spheres",
    [
      ballCourtSphere(context(ball(), "ball"), "ball", ["right"]).sphere,
      ballCourtSphere(
        context(
          ball({ body: { mass: 0.6, centerOfMass: null, restitution: 0.8 } }),
          "ball",
        ),
        "ball",
        ["right"],
      ).sphere,
    ],
    [
      { radius: 0.12, centre: { x: 0, y: 0.01, z: 0 } },
      { radius: 0.12, centre: { x: 0, y: 0.01, z: 0 }, tangentialFriction: 0 },
    ],
  );
  TestValidator.predicate(
    "unheld or fixed",
    throwsError(() =>
      ballCourtSphere(context(ball(), undefined), "ball", ["right"]),
    ) &&
      throwsError(() =>
        ballCourtSphere(context(ball({ fixed: true }), "ball"), "ball", [
          "right",
        ]),
      ),
  );
}
