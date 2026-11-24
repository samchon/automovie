import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { ballCourtSphere } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

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

/** A context whose hands hold what is given, reading the one ball. */
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
 * `ballCourtSphere` reads the one spherical ball a court release moves: held by
 * a releasing hand, portable, with one sphere collider whose radius and centre
 * the launch carries; a ball with restitution and no friction launches with no
 * tangential loss.
 *
 * Scenarios:
 *
 * 1. Held in the right hand, the ball's sphere is its 0.12 m collider about its 1
 *    cm offset.
 * 2. With a restitution and no friction its sphere carries no tangential friction
 *    loss.
 * 3. A ball no releasing hand holds, a fixed ball or one of two colliders is
 *    refused.
 */
export function test_unit_motions_sport_ball_court_sphere(): void {
  TestValidator.equals(
    "the held ball's sphere",
    ballCourtSphere(context(ball(), "ball"), "ball", ["right"]).sphere,
    { radius: 0.12, centre: { x: 0, y: 0.01, z: 0 } },
  );
  TestValidator.equals(
    "a lossless bounce",
    ballCourtSphere(
      context(
        ball({ body: { mass: 0.6, centerOfMass: null, restitution: 0.8 } }),
        "ball",
      ),
      "ball",
      ["right"],
    ).sphere,
    { radius: 0.12, centre: { x: 0, y: 0.01, z: 0 }, tangentialFriction: 0 },
  );
  TestValidator.predicate(
    "unheld, fixed, or not one sphere",
    throwsError(() =>
      ballCourtSphere(context(ball(), undefined), "ball", ["right"]),
    ) &&
      throwsError(() =>
        ballCourtSphere(context(ball({ fixed: true }), "ball"), "ball", [
          "right",
        ]),
      ) &&
      throwsError(() =>
        ballCourtSphere(
          context(ball({ shapes: [SPHERE, SPHERE] }), "ball"),
          "ball",
          ["right"],
        ),
      ),
  );
}
