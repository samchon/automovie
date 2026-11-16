import {
  type IAutoMovieResolvedBone,
  fitDigitToTarget,
  prepareSkeletonPoseResolution,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/joint";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * The actual digit task-priority solver may prepare its fixed non-digit pose
 * while every Jacobian probe still applies the current complete finger edits.
 * This is an isolated planar kernel rig, not a Human-motion population claim.
 *
 * Scenarios:
 * 1. Three unit links reach two interior poses and then the first again.
 *    Explicit sums of planar cosines/sines fix the target point and normal,
 *    including a nonidentity root and a fixed hand articulation.
 * 2. Changing the non-digit hand articulation between fits requires a new
 *    baseline. Current target contact, normal, every actual joint bound and
 *    original-target residual must still hold through prepared and raw paths.
 * 3. Earlier caller-result mutation cannot alter replay. An overwritten
 *    nonfinite unrelated authored joint refuses in the prepared path instead
 *    of being hidden by effector-only demand, then valid input recovers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the isolated unit-link metre rig, degree/normal equations, fixed versus current solve inputs, existing0.5mm digit contact precision and three actual-consumer scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual fitDigitToTarget with and without an explicit static rig, substitutes returned clinical joints into full raw FK, and checks independently reachable points/normals, original residuals, ROM, changed baselines, replay ownership and unrelated invalid authored admission.
 * @evidence contracts/development/testing.md#independent-expectations The tip is the fixed proximal offset plus three unit vectors at cumulative finger angles, rotated by the authored root30 plus current hand angle. The normal is that cumulative final angle applied to plus Y. These trigonometric equations do not call FK to construct targets; FK only observes achieved output. Position retains the existing5e-4m digit bound, and the normal bound1e-4 allows less than0.006degree for the three1e-3degree joint-resolution contributions.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers A/B/A changing point+normal targets, raw versus prepared execution, nonidentity root/hand, a changed non-digit baseline, current range/residual checks, mutated prior output and invalid overwritten stray source admission. Human anatomical digit coverage and opposition remain in the existing canonical-body feature test.
 * @evidence contracts/development/testing.md#execution-ownership One portable discoverable kernel unit owns every finite planar rig/input and calls real public fitting/FK APIs. It creates no Human imitation for motion validation, starts no host/compiler and introduces no internal export or foreign replacement.
 */
export function test_engine_digit_prepared_baseline(): void {
  const axes: IAutoMovieJointAxes = {
    flexion: { x: 0, y: 0, z: 1 }, abduction: { x: 1, y: 0, z: 0 }, twist: { x: 0, y: 1, z: 0 },
  };
  const names: readonly AutoMovieHumanoidBone[] = ["leftIndexProximal", "leftIndexIntermediate", "leftIndexDistal"];
  const skeleton: IAutoMovieSkeleton = {
    id: "planar-digit-kernel",
    bones: [bone("leftHand", null, 0, axes, false),
      bone(names[0]!, "leftHand", 1, axes, true),
      bone(names[1]!, names[0]!, 1, axes, true),
      bone(names[2]!, names[1]!, 1, axes, true)],
  };
  const rig: ReturnType<typeof prepareSkeletonPoseResolution> = prepareSkeletonPoseResolution(skeleton, {}, {});
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: { translation: { x: 2, y: 3, z: 4 },
      rotation: { x: 0, y: 0, z: Math.sin(Math.PI / 12), w: Math.cos(Math.PI / 12) },
      scale: { x: 1, y: 1, z: 1 } },
    joints: [joint("leftHand", { flexion: 15 }),
      joint(names[0]!, { flexion: 10 }), joint(names[1]!, { flexion: 20 }), joint(names[2]!, { flexion: 15 })],
  };
  let previous: fitDigitToTarget.IResult | undefined;
  for (const [hand, angles] of [
    [15, [20, 30, 10]], [15, [35, 25, 15]], [15, [20, 30, 10]], [-10, [20, 30, 10]],
  ] as const) {
    pose.joints[0]!.flexion = hand;
    const wanted: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } = target(hand, angles);
    for (const prepared of [true, false]) {
      const result: fitDigitToTarget.IResult = fitDigitToTarget({
        skeleton, pose, bones: names,
        effector: { bone: names[2]!, point: { x: 1, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
        target: wanted.point, normal: wanted.normal,
        ...(prepared ? { rig } : {}),
      });
      const fitted: IAutoMoviePose = { ...pose, joints: [pose.joints[0]!, ...result.joints] };
      const frame: IAutoMovieResolvedBone = resolvePose(fitted, skeleton).find(
        (value: IAutoMovieResolvedBone): boolean => value.bone === names[2],
      )!;
      const z: number = Math.atan2(frame.worldRotation.z, frame.worldRotation.w) * 2;
      const displayed: IAutoMovieVector3 = {
        x: frame.worldPosition.x + Math.cos(z), y: frame.worldPosition.y + Math.sin(z), z: frame.worldPosition.z,
      };
      const distance: number = Math.hypot(displayed.x - wanted.point.x, displayed.y - wanted.point.y, displayed.z - wanted.point.z);
      TestValidator.predicate("actual prepared digit Jacobian retains current point and original residual",
        distance <= 5e-4 && vclose(result.point, displayed, 1e-9) &&
        nclose(result.residual, distance, 1e-9),
      );
      TestValidator.predicate("secondary normal remains feasible without trading its point goal",
        Math.hypot(result.normal.x - wanted.normal.x, result.normal.y - wanted.normal.y,
          result.normal.z - wanted.normal.z) <= 1e-4,
      );
      TestValidator.predicate("actual clamped digit joints retain each declared interval",
        result.joints.length === 3 && result.joints.every((value: IAutoMovieJointPose): boolean =>
          value.flexion !== null && value.flexion >= 0 && value.flexion <= 90 &&
          (value.abduction === null || value.abduction === 0) && (value.twist === null || value.twist === 0)),
      );
      if (previous !== undefined)
        TestValidator.predicate("new fit cannot borrow or repair an earlier caller result",
          previous.point.x === 123 && previous.joints[0]!.flexion === 456 &&
          result.point !== previous.point && result.joints !== previous.joints,
        );
      result.point.x = 123;
      result.joints[0]!.flexion = 456;
      previous = result;
    }
  }
  const good: fitDigitToTarget.IInput = {
    skeleton, pose, bones: names, rig,
    effector: { bone: names[2]!, point: { x: 1, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
    target: target(-10, [20, 30, 10]).point,
  };
  pose.joints.push(joint("rightFoot", { flexion: NaN }), joint("rightFoot", { flexion: 0 }));
  TestValidator.predicate("ordered invalid unrelated source cannot hide behind selected digit demand",
    throwsError((): fitDigitToTarget.IResult => fitDigitToTarget(good)),
  );
  pose.joints.splice(pose.joints.length - 2, 2);
  TestValidator.predicate("valid source recovers after an unrelated admission failure",
    fitDigitToTarget(good).residual <= 5e-4,
  );
}

/** Construct one plain kernel bone; only finger flexion is mobile. */
function bone(name: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null,
  x: number, axes: IAutoMovieJointAxes, finger: boolean): IAutoMovieBone {
  return { bone: name, parent, axes,
    rest: { translation: { x, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } },
    constraint: finger ? { flexion: { min: 0, max: 90 }, abduction: null, twist: null } : null };
}

/** Sum the planar unit links and rotate by the independently authored hand/root frame. */
function target(hand: number, angles: readonly number[]): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
  let angle: number = (30 + hand) * Math.PI / 180;
  let x: number = Math.cos(angle);
  let y: number = Math.sin(angle);
  for (const value of angles) {
    angle += value * Math.PI / 180;
    x += Math.cos(angle);
    y += Math.sin(angle);
  }
  return { point: { x: 2 + x, y: 3 + y, z: 4 }, normal: { x: -Math.sin(angle), y: Math.cos(angle), z: 0 } };
}
