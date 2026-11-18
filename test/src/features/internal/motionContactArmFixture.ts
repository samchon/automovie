import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionClock, stand } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * Construct an arm and an explicitly timed phrase. The right wrist moves
 * along +Z from the origin of its path while a passive target can move in X.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the side, axes, clock and independent posture written by each caller.
 * @evidence contracts/development/implementation.md#principled-implementation Each inspection gets its own body operation, clock and rest posture; the target is a world landmark with identity orientation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The fixture supplies only inputs and the final emitted wrist observation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No production planner supplies the expected point or the tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each sample reads only one emitted goal.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the standard polygon body and the public clock and posture builders.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No operation, pose or result is cached between cases.
 */
export function motionContactArmFixture(): motionContactArmFixture.IInputs {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const posture: IAutoMovieMotionHumanPosture = {
    ...stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
    root: { x: 0, y: 0, z: 0 },
  };
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: 1,
    wait: 1,
    attack: 1,
    follow: 1,
    hold: 1,
    retract: 1,
  });
  const origin: IAutoMovieMotionHumanArmTarget.IOrigin = {
    point: { x: 0, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  return { body, posture, clock, origin };
}

/** Contract shared by the independent primitive specimens. */
export namespace motionContactArmFixture {
  /** The test's body-carried origin and public input clock. */
  export interface IInputs {
    /** Measured polygon body. */
    body: IAutoMovieMotionHumanBody;
    /** Untouched standing input. */
    posture: IAutoMovieMotionHumanPosture;
    /** Six one-second phases. */
    clock: IAutoMovieMotionClock;
    /** Source point in the standing root frame. */
    origin: IAutoMovieMotionHumanArmTarget.IOrigin;
  }

  /** One independently authored wrist target at the stated world point. */
  export function target(
    point: IAutoMovieVector3,
  ): IAutoMovieMotionHumanArmTarget.ITarget {
    return {
      surface: "wrist",
      shape: "relaxed",
      point,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      bend: { x: -1, y: 1, z: 0 },
    };
  }

  /** Read the right wrist goal from the public writer and compare it with the caller's world-point oracle. */
  export function inspect(
    primitive: IAutoMovieMotionHumanPrimitive,
    posture: IAutoMovieMotionHumanPosture,
    time: number,
    expected: IAutoMovieVector3,
  ): void {
    const shown: IAutoMovieMotionHumanPosture = primitive.write(posture, time);
    const point: IAutoMovieVector3 = shown.limbs.rightArm!.point;
    TestValidator.predicate(
      `at ${time} s wrist ${JSON.stringify(point)} reaches ${JSON.stringify(expected)}`,
      Vector3.distance(point, expected) <= 1e-9,
    );
  }
}
