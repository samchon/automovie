import { Quaternion, clampPose, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";
import { poseBones, resolveHumanPosture } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** The displayed seconds of the mount-up, each continued from the one before it. */
const FRAMES: number = 40;

/** The leg joints a fit writes and the range clamp must leave as they are. */
const LEG: readonly AutoMovieHumanoidBone[] = [
  "leftUpperLeg",
  "leftLowerLeg",
  "leftFoot",
];

/** The most a knee may lie off its pole's side about the hip-to-ankle line, degrees. */
const TOWARD: number = 1;

/** The most a fitted ankle may lie off its goal, metres: a millimetre. */
const ANKLE: number = 1e-3;

/** The most a clamp may move a fitted leg joint, degrees: the fit is legal as it stands. */
const LEGAL: number = 1e-6;

/**
 * A knee a law placed (`elbow: "placed"` on a leg) is held at its pole
 * through a seated mount-up, continued from second to second, and the fit
 * is legal at every second: the leg takes the legal swivel nearest its pole
 * in closed form as the arm does, and a continued fit of a flat foot keeps
 * the side its seed chose.
 *
 * Scenarios, on the small woman and the large man:
 * 1. The left foot, flat, rises from under the hip forward and up to a
 *    seated height over forty seconds, the knee's hint ahead of the thigh
 *    and a little outward, placed; each second continues the fit before
 *    it, as a display does. At every second the ankle is on its goal within
 *    a millimetre, the knee lies within a degree of its pole's side about
 *    the hip-to-ankle line (so it never flips), and the range clamp leaves
 *    every leg joint as fitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the placed-knee contract, the path, the bodies and each bound.
 * @evidence contracts/development/testing.md#behavioral-verification Fits each second through resolveHumanPosture.seeded with the previous second's seed and reads the knee and ankle off the posed bones and the joints through the range clamp.
 * @evidence contracts/development/testing.md#independent-expectations The pole's side is the law's own placed hint; the clamp is the engine's range table, independent of the fit.
 * @evidence contracts/development/testing.md#distinguishing-cases A mount-up from a straight standing leg to a deeply flexed seated one on both extreme bodies.
 * @evidence contracts/development/testing.md#execution-ownership Pure posture fits on in-memory polygon bodies.
 */
export function test_motion_contact_placed_knee(): void {
  for (const name of ["f-small", "m-large"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const raw: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, resolveHumanPosture(body, raw));
    const hip: IAutoMovieVector3 = rest.get("leftUpperLeg")!.worldPosition;
    const ankle: IAutoMovieVector3 = rest.get("leftFoot")!.worldPosition;
    const leg: number = length(minus(hip, ankle));
    const point = (share: number): IAutoMovieVector3 => ({
      x: hip.x,
      y: hip.y - leg * (0.96 - 0.46 * share),
      z: hip.z + leg * 0.5 * share,
    });
    // Outward is away from the body's midline, the side the left hip lies on.
    const hint = (share: number): IAutoMovieVector3 => ({
      x: hip.x + Math.sign(hip.x) * leg * 0.15,
      y: hip.y - leg * (0.45 - 0.2 * share),
      z: hip.z + leg * (0.4 + 0.3 * share),
    });
    const posture = (share: number): IAutoMovieMotionHumanPosture => ({
      ...raw,
      limbs: {
        leftLeg: {
          point: point(share),
          rotation: Quaternion.identity(),
          bend: hint(share),
          elbow: "placed",
        },
      },
    });
    let seed: IAutoMovieSwivelSeed | null | undefined;
    for (let i: number = 0; i <= FRAMES; ++i) {
      const share: number = i / FRAMES;
      const near: IAutoMovieMotionHumanResolveHumanPosture.INear =
        seed === undefined || seed === null
          ? {}
          : { leftLeg: { ...seed, tolerance: hingedArmSwivel.RESOLUTION } };
      const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
        resolveHumanPosture.seeded(body, posture(share), undefined, near);
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, fitted.pose);
      const at: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
      const knee: IAutoMovieVector3 = bones.get("leftLowerLeg")!.worldPosition;
      const root: IAutoMovieVector3 = bones.get("leftUpperLeg")!.worldPosition;
      TestValidator.predicate(
        `${name} at ${i} of ${FRAMES}: the ankle is on its goal (${(length(minus(at, point(share))) * 1000).toFixed(3)} mm off)`,
        length(minus(at, point(share))) <= ANKLE,
      );

      // The knee's and the hint's offsets across the hip-to-ankle line.
      const axis: IAutoMovieVector3 = unit(minus(at, root));
      const radial = (p: IAutoMovieVector3): IAutoMovieVector3 =>
        minus(p, plus(root, scale(axis, dot(minus(p, root), axis))));
      const toward: number =
        (Math.acos(
          Math.max(
            -1,
            Math.min(1, dot(unit(radial(knee)), unit(radial(hint(share))))),
          ),
        ) *
          180) /
        Math.PI;
      TestValidator.predicate(
        `${name} at ${i} of ${FRAMES}: the placed knee lies toward its pole (${toward.toFixed(3)} degrees off)`,
        toward <= TOWARD,
      );
      const moved: number = clamped(body, fitted.pose);
      TestValidator.predicate(
        `${name} at ${i} of ${FRAMES}: the leg is legal as fitted (the clamp moves a joint ${moved} degrees)`,
        moved <= LEGAL,
      );
      seed = fitted.seeds.leftLeg;
    }
  }
}

/** The most the range clamp moves any leg joint of a pose, degrees. */
function clamped(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
): number {
  const after: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
    clampPose(pose, body.skeleton).joints.map(
      (
        joint: IAutoMovieJointPose,
      ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [joint.bone, joint],
    ),
  );
  let worst: number = 0;
  for (const joint of pose.joints) {
    if (!LEG.includes(joint.bone)) continue;
    const other: IAutoMovieJointPose | undefined = after.get(joint.bone);
    if (other === undefined) continue;
    worst = Math.max(
      worst,
      Math.abs((joint.flexion ?? 0) - (other.flexion ?? 0)),
      Math.abs((joint.abduction ?? 0) - (other.abduction ?? 0)),
      Math.abs((joint.twist ?? 0) - (other.twist ?? 0)),
    );
  }
  return worst;
}

/** a - b. */
function minus(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** a + b. */
function plus(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/** a scaled by s. */
function scale(a: IAutoMovieVector3, s: number): IAutoMovieVector3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

/** The dot product of a and b. */
function dot(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** The length of a. */
function length(a: IAutoMovieVector3): number {
  return Math.sqrt(dot(a, a));
}

/** a over its length. */
function unit(a: IAutoMovieVector3): IAutoMovieVector3 {
  return scale(a, 1 / length(a));
}
