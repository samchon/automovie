import { Vector3, AutoMovieEnginePhysics, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidRegion, IAutoMovieMotionClock, IAutoMovieMotionHumanArmTarget, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPrimitive, IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import { AutoMovieMotionClock, HumanColliders } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";
import type { motionHumanLaw } from "./motionHumanLaw";

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
    ...AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
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
  /** Resolve a named skin landmark using its carrier's displayed transform. */
  export function site(
    body: IAutoMovieMotionHumanBody,
    bones: motionHumanLaw.Bones,
    region: AutoMovieHumanoidRegion,
  ): IAutoMovieVector3 {
    const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
      body.surfaces.regions[region];
    return AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(frame, bones.get(frame.bone)!)
      .point;
  }

  /** Signed skin distance in metres from one hand and its fingers to an external world point. */
  export function skin(
    body: IAutoMovieMotionHumanBody,
    bones: motionHumanLaw.Bones,
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
  ): number {
    const prefix: RegExp = new RegExp(
      "^" + side + "(Hand|Thumb|Index|Middle|Ring|Little)",
    );
    const hand: motionHumanLaw.Bones = new Map(
      [...bones].filter(([bone]) => prefix.test(bone)),
    );
    return HumanColliders.distance(body, hand, point).distance;
  }

  /** Least signed separation of two externally selected sets of displayed physical segments. */
  export function separation(
    bodyA: IAutoMovieMotionHumanBody,
    bonesA: motionHumanLaw.Bones,
    selectedA: RegExp,
    bodyB: IAutoMovieMotionHumanBody,
    bonesB: motionHumanLaw.Bones,
    selectedB: RegExp,
  ): number {
    const first: ReturnType<typeof HumanColliders.placed> =
      HumanColliders.placed(bodyA, bonesA).filter((segment) =>
        selectedA.test(segment.bone),
      );
    const second: ReturnType<typeof HumanColliders.placed> =
      HumanColliders.placed(bodyB, bonesB).filter((segment) =>
        selectedB.test(segment.bone),
      );
    let least: number = Infinity;
    for (const a of first)
      for (const b of second)
        for (const left of a.shapes)
          for (const right of b.shapes)
            least = Math.min(
              least,
              AutoMovieEnginePhysics.physicalShapePairDistance(a.pose, left, b.pose, right),
            );
    return least;
  }
}
