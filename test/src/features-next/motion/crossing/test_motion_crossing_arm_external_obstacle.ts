import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance, HumanRefusal } from "@automovie/motions";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanTarget,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A planned arm keeps clear of a collider no human body carries (a prop's,
 * an animal's), and a refusal names it by its subject and part.
 *
 * Scenarios:
 * 1. The average man's right hand reaches from the quiet stance onto a place
 *    ahead at waist height, and a prop's box (subject `horse`, part `neck`)
 *    encloses that place: the planned course is refused, and the refusal
 *    names `horse:neck`.
 * 2. The same reach with the box beside the place, out of the arm's way, is
 *    planned.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Prepares the real carried arm with the goal's external colliders; a box around the site must refuse and name its subject and part, a box out of the way must not refuse.
 * @evidence contracts/development/testing.md#independent-expectations The box's placement is stated here relative to the place the hand is sent to.
 * @evidence contracts/development/testing.md#distinguishing-cases An obstacle on the site and one out of the way.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States both scenarios and the named part.
 */
export function test_motion_crossing_arm_external_obstacle(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const quiet: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const side: AutoMovieHumanSide = "right";
  const place = {
    point: { x: -0.2, y: 0.95, z: 0.4 },
    normal: { x: 0, y: 1, z: 0 },
  };
  const neck = (x: number): IAutoMovieMotionHumanColliders.IExternal => ({
    subject: "horse",
    part: "neck",
    pose: {
      position: { ...place.point, x },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    shapes: [
      {
        id: "neck",
        material: "hide",
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        kind: "box",
        halfExtents: { x: 0.12, y: 0.12, z: 0.12 },
      },
    ],
  });
  const plan = (
    external: IAutoMovieMotionHumanColliders.IExternal,
  ): unknown => {
    const goal: IAutoMovieHumanLimbGoal = {
      ...AutoMovieMotionHumanArm.goal(
        body,
        side,
        AutoMovieMotionHumanTarget.hand(body, quiet, side, place, {
          bend: "front",
        }),
      ),
      clearExternal: [external],
    };
    const span = { start: 0, ready: 0.8, relax: 1.5, end: 1.5 };
    const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried(
      {
        body,
        side,
        from: span.start,
        to: span.end,
        rest: AutoMovieMotionHumanArm.angles(
          resolveHumanPosture(body, quiet),
          side,
        ),
        goal: (): IAutoMovieHumanLimbGoal => goal,
        weight: (seconds: number): number => Math.min(1, seconds / span.ready),
        span,
      },
    );
    try {
      arm.prepare!((): IAutoMovieMotionHumanPosture => quiet);
      return undefined;
    } catch (error) {
      return error;
    }
  };

  const blocked: unknown = plan(neck(place.point.x));
  TestValidator.predicate(
    `a prop's box around the site refuses the course and names it (${String(blocked)})`,
    blocked instanceof HumanRefusal &&
      String(blocked.reason).includes("horse:neck"),
  );
  const clear: unknown = plan(neck(place.point.x + 1.2));
  TestValidator.predicate(
    `a prop's box out of the arm's way leaves the course planned (${String(clear)})`,
    clear === undefined,
  );
}
