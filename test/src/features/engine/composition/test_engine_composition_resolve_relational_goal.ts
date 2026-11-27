import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineCompositionPose } from "@automovie/engine";
import type {
  IAutoMoviePhysicalSegment,
  IAutoMovieResolveRelationalGoal,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../internal/PhysicalModelFixtures";

/** How near the reached surface lands on its target, metres: a centimetre. */
const REACH: number = 0.01;

/**
 * `resolveRelationalGoal` resolves a goal on another subject's named
 * region, never on a scene coordinate: within its window the performer's
 * surface is reached onto the target, read at the window's start under `freeze`
 * and at the instant under `track`; outside the window the prior pose returns
 * unchanged.
 *
 * Scenarios, two stick men, `a` still and `b` drifting 0.1 m/s along -Z, `a`'s
 * right hand reaching `b`'s head between 1 and 2 s:
 *
 * 1. At 1.5 s under `freeze` the target is where the head was at 1 s, z = -0.5;
 *    under `track` where it is at 1.5 s, z = -0.55; both are reached within a
 *    centimetre, the hand's surface on the frozen point.
 * 2. At 2.5 s, past the window, the goal is inactive, has no point, and the
 *    targets are `a`'s prior pose.
 */
export function test_engine_composition_resolve_relational_goal(): void {
  const { profile } = PhysicalModelFixtures.stickman();
  const neutral = (
    offset: IAutoMovieVector3,
  ): Record<string, IAutoMovieRigidTransform> =>
    Object.fromEntries(
      profile.segments.map(
        (s: IAutoMoviePhysicalSegment): [string, IAutoMovieRigidTransform] => [
          s.bone,
          {
            position: AutoMovieEngineVector3.add(s.neutral.position, offset),
            rotation: { ...s.neutral.rotation },
          },
        ],
      ),
    );
  const body = (
    offset: (seconds: number) => IAutoMovieVector3,
  ): IAutoMovieResolveRelationalGoal.IBody => ({
    profile,
    pose: (seconds: number) => neutral(offset(seconds)),
    regions: { head: { bone: "head", localPoint: { x: 0, y: 0.1, z: 0 } } },
    support: () => ({
      bone: "leftLowerLeg",
      localPoint: { x: 0, y: -0.396, z: 0 },
      normal: { x: 0, y: 1, z: 0 },
      minimum: -0.3,
      maximum: 0.3,
    }),
    bones: [
      "leftLowerLeg",
      "leftUpperLeg",
      "spine",
      "rightUpperArm",
      "rightLowerArm",
      "rightHand",
    ],
  });
  const bodies: Record<string, IAutoMovieResolveRelationalGoal.IBody> = {
    a: body(() => ({ x: 0, y: 0, z: 0 })),
    b: body((seconds: number) => ({
      x: -0.9,
      y: -0.15,
      z: -0.4 - 0.1 * seconds,
    })),
  };
  const reach = (
    lock: "freeze" | "track",
    seconds: number,
  ): IAutoMovieResolveRelationalGoal.IResult =>
    AutoMovieEngineCompositionPose.relationalGoal({
      performer: "a",
      goal: {
        surface: { bone: "rightHand", localPoint: { x: -0.05, y: 0, z: 0 } },
        target: { subject: "b", region: "head" },
        window: { start: 1, end: 2 },
        lock,
      },
      bodies,
      seconds,
    });
  const hand = (
    result: IAutoMovieResolveRelationalGoal.IResult,
  ): IAutoMovieVector3 => {
    const pose: IAutoMovieRigidTransform = result.targets.rightHand!;
    return AutoMovieEngineVector3.add(
      pose.position,
      AutoMovieEngineQuaternion.rotateVector(pose.rotation, { x: -0.05, y: 0, z: 0 }),
    );
  };
  const frozen = reach("freeze", 1.5);
  const tracked = reach("track", 1.5);
  TestValidator.predicate(
    "frozen and tracked targets",
    frozen.active &&
      Math.abs(frozen.point!.z - (-0.4 - 0.1 * 1)) < 1e-12 &&
      Math.abs(tracked.point!.z - (-0.4 - 0.1 * 1.5)) < 1e-12 &&
      frozen.position < REACH &&
      tracked.position < REACH &&
      AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(hand(frozen), frozen.point!)) < REACH,
  );
  const outside = reach("track", 2.5);
  TestValidator.predicate(
    "outside the window the prior stands",
    !outside.active &&
      outside.point === null &&
      JSON.stringify(outside.targets) === JSON.stringify(bodies.a!.pose(2.5)),
  );
}
