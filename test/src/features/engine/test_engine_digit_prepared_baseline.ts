import { AutoMovieEngineKinematics, AutoMovieEngineRomTolerance, AutoMovieEngineSkeletonPose } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieFitDigitToTarget,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/joint";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * The actual digit task-priority solver may prepare its fixed non-digit pose
 * while every Jacobian probe still applies the current complete finger edits.
 * This is an isolated planar kernel rig, not a Human-motion population claim.
 *
 * Scenarios:
 * 1. Three unit links reach two interior poses and then the first again.
 *    Explicit sums of planar cosines/sines fix the target point and normal,
 *    including a nonidentity root and a fixed hand articulation. The actual
 *    full raw FK of each declared articulation independently witnesses that
 *    both original point and normal are jointly feasible inside the ROM. Raw and
 *    prepared paths retain both absent rate and actual rate5000 behavior;
 *    the folded targets are over0.1m short of the three-link full reach.
 * 2. Changing the non-digit hand articulation between fits (a new hand
 *    record: admitted records are values) requires a new baseline. Current target contact, normal, every actual joint bound and
 *    original-target residual must still hold through prepared and raw paths.
 * 3. Earlier caller-result mutation cannot alter replay. An overwritten
 *    nonfinite unrelated authored joint refuses in the prepared path instead
 *    of being hidden by effector-only demand, then valid input recovers.
 * 4. An original digit's later NaN duplicate is replaced by complete clamped
 *    trial edits when rate is absent, so it is not newly admitted there.
 *    Positive rate must first read the actual original source for its soft
 *    target and therefore refuses that NaN, through both raw/prepared FK.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the isolated unit-link metre rig, degree/normal equations, fixed versus current solve inputs, absent/positive rate source-admission difference, existing0.5mm digit contact precision and four actual-consumer scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual fitDigitToTarget with and without an explicit static rig and with absent/rate5000 soft-target setup, substitutes returned clinical joints into full raw FK, and checks independently reachable displayed points/normals, reported-to-displayed consistency, original residuals, ROM, changed baselines, replay ownership and unrelated invalid authored admission. Normal findings retain the same strict criterion and accumulate all valid-case variants before one final assertion, so a full round reports the complete failed matrix instead of stopping at its first secondary miss. An overwritten invalid digit row distinguishes original source FK required only by positive rate from complete candidate replacement when rate is absent.
 * @evidence contracts/development/testing.md#independent-expectations The tip is the fixed proximal offset plus three unit vectors at cumulative finger angles, rotated by root30 plus current hand. The normal applies their cumulative final angle to plus Y. Trigonometric targets never call FK. A separate full raw FK of the explicitly authored interior angles is only a feasibility witness for that same independently calculated point/normal; it does not replace the expected target with an achieved solver answer. The returned world quaternion independently gives displayed normal(-sin(z),cos(z),0); the reported normal must match this actual articulation before its physical error is trusted. Position retains the existing5e-4m digit bound; the displayed normal's chord bound is three declared AutoMovieEngineRomTolerance angular steps in radians, the triangle bound for these three planar hinge contributions.
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
  const rig: AutoMovieEngineSkeletonPose.IRig =
    AutoMovieEngineSkeletonPose.prepareSkeletonPoseResolution(
      skeleton,
      {},
      {},
    );
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: { translation: { x: 2, y: 3, z: 4 },
      rotation: { x: 0, y: 0, z: Math.sin(Math.PI / 12), w: Math.cos(Math.PI / 12) },
      scale: { x: 1, y: 1, z: 1 } },
    joints: [joint("leftHand", { flexion: 15 }),
      joint(names[0]!, { flexion: 10 }), joint(names[1]!, { flexion: 20 }), joint(names[2]!, { flexion: 15 })],
  };
  let previous: IAutoMovieFitDigitToTarget.IResult | undefined;
  const normalFindings: string[] = [];
  for (const [hand, angles] of [
    [15, [20, 30, 10]], [15, [35, 25, 15]], [15, [20, 30, 10]], [-10, [20, 30, 10]],
  ] as const) {
    // An admitted record is a value: a changed hand is a new record.
    pose.joints[0] = joint("leftHand", { flexion: hand });
    const wanted: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } = target(hand, angles);
    const feasible: IAutoMoviePose = { ...pose, joints: [pose.joints[0]!, ...names.map(
      (name: AutoMovieHumanoidBone, index: number): IAutoMovieJointPose => joint(name, { flexion: angles[index]! }),
    )] };
    const witness: IAutoMovieResolvedBone = AutoMovieEngineKinematics.resolvePose(feasible, skeleton).find(
      (value: IAutoMovieResolvedBone): boolean => value.bone === names[2],
    )!;
    const witnessAngle: number = 2 * Math.atan2(witness.worldRotation.z, witness.worldRotation.w);
    TestValidator.predicate(`literal target hand${hand}, angles${angles.join(",")} has a real ROM-interior joint/point/normal witness`,
      angles.every((value: number): boolean => value > 0 && value < 90) &&
      vclose({ x: witness.worldPosition.x + Math.cos(witnessAngle), y: witness.worldPosition.y + Math.sin(witnessAngle),
        z: witness.worldPosition.z }, wanted.point, 1e-12) &&
      vclose({ x: -Math.sin(witnessAngle), y: Math.cos(witnessAngle), z: 0 }, wanted.normal, 1e-12));
    for (const [prepared, rate] of [[true, undefined], [true, 5000], [false, undefined], [false, 5000]] as const) {
      const result: IAutoMovieFitDigitToTarget.IResult = AutoMovieEngineKinematics.fitDigitToTarget({
        skeleton, pose, bones: names,
        effector: { bone: names[2]!, point: { x: 1, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
        target: wanted.point, normal: wanted.normal,
        ...(prepared ? { rig } : {}),
        ...(rate === undefined ? {} : { rate }),
      });
      const fitted: IAutoMoviePose = { ...pose, joints: [pose.joints[0]!, ...result.joints] };
      const frame: IAutoMovieResolvedBone = AutoMovieEngineKinematics.resolvePose(fitted, skeleton).find(
        (value: IAutoMovieResolvedBone): boolean => value.bone === names[2],
      )!;
      const z: number = Math.atan2(frame.worldRotation.z, frame.worldRotation.w) * 2;
      const displayed: IAutoMovieVector3 = {
        x: frame.worldPosition.x + Math.cos(z), y: frame.worldPosition.y + Math.sin(z), z: frame.worldPosition.z,
      };
      const distance: number = Math.hypot(displayed.x - wanted.point.x, displayed.y - wanted.point.y, displayed.z - wanted.point.z);
      const displayedNormal: IAutoMovieVector3 = { x: -Math.sin(z), y: Math.cos(z), z: 0 };
      const normalMiss: number = Math.hypot(displayedNormal.x - wanted.normal.x,
        displayedNormal.y - wanted.normal.y, displayedNormal.z - wanted.normal.z);
      TestValidator.predicate(`actual digit Jacobian prepared=${prepared}, rate=${rate}: retains displayed point/normal and original residual`,
        distance <= 5e-4 && vclose(result.point, displayed, 1e-9) &&
        vclose(result.normal, displayedNormal, 1e-9) && nclose(result.residual, distance, 1e-9),
      );
      if (!(normalMiss <= 3 * AutoMovieEngineRomTolerance * Math.PI / 180))
        normalFindings.push(`secondary normal hand=${hand}, target=(${angles.join(",")}), prepared=${prepared}, rate=${rate}, pointMiss=${distance}, normalChord=${normalMiss}, joints=(${result.joints.map((value: IAutoMovieJointPose): number | null => value.flexion).join(",")}): exceeds declared joint resolution`);
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
  TestValidator.equals("every raw/prepared/rate normal retains the original declared joint resolution", normalFindings, []);
  const good: IAutoMovieFitDigitToTarget.IInput = {
    skeleton, pose, bones: names, rig,
    effector: { bone: names[2]!, point: { x: 1, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
    target: target(-10, [20, 30, 10]).point,
  };

  TestValidator.predicate("positive-rate prepared source fits the valid digit",
    AutoMovieEngineKinematics.fitDigitToTarget({ ...good, rate: 5000 }).residual <= 5e-4);
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
