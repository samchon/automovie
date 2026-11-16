import { type IAutoMovieResolvedBone, type IAutoMovieSwivelNear, Quaternion } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanLegChain,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/**
 * A fixed-pelvis leg workspace keeps current targets and continuation seeds
 * independent while retaining the real Human chain's geometry and fit.
 *
 * Scenarios:
 * 1. On both legs, A/B/A world targets shorten the measured two-link span
 *    by8cm or10cm with small sideways/forward reaches. Every current
 *    prepared seeded request is reconstructed from its own swivel and
 *    compared to a full public memory-disabled resolver at the same near
 *    seed. Actual thigh/shank lengths and ankle target remain physical.
 * 2. A previous seed with two current refinement widths remains an explicit
 *    query input; later cold A restores its own answer. Mutating an earlier
 *    returned knee/ankle cannot poison later geometry.
 * 3. Another poser with a different fixed hip and pelvis heading has the
 *    independently rotated/translated knee. Returning to the original
 *    poser cannot retain that other frame's coordinates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines canonical Human provenance, fixed pelvis/hip lifetime, metre targets, current near refinement, physical link/contact bounds, independent frame covariance and three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public HumanLegChain.prepareSeeded/prepare for changing complete goals, observes their actual posed links and full public disabled-resolution FK, checks current endpoint/segment geometry, near-seed parity, prior-output isolation and separate fixed-frame readers.
 * @evidence contracts/development/testing.md#independent-expectations Literal relative targets lie inside the two-link shell measured from canonical rest geometry. Rigid bones preserve those measured lengths within1e-9m and reached ankles retain0.001m; a read swivel reconstructs the full fit's knee within the existing leg-chain1e-6m. The second fixed frame applies an explicit Y rotation matrix and translation to the first knee, independently of the prepared helpers. Full disabled resolution supplements these geometric expectations and is not a cached answer.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both mirrored sides, nonzero initial heading/root, cold versus two current near widths, A/B/A, distinct target and bend inputs, a separate fixed hip/pelvis and mutated earlier generated coordinates. Unreachable shell and malformed raw-joint admission retain their engine/prepared-rig tests.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable numerical unit borrows immutable canonical geometry through a fresh body owner and owns all source/target/near records. Public memory bypass is restored in finally; no internal helper import, test-only export, foreign replacement, host or compiler is introduced.
 */
export function test_motion_prepared_leg_chain(): void {
  const body: IHumanBody = { ...motionHumanBody("m-average") };
  const raw: IHumanPosture = {
    root: { x: 2, y: 0.5, z: -3 }, yaw: 37, pitch: 0, roll: 0, joints: {}, limbs: {},
  };
  const neutral: IAutoMoviePose = resolveHumanPosture(body, raw);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, neutral);
  const pelvis: IAutoMovieQuaternion = bones.get("hips")!.worldRotation;
  try {
    for (const side of ["left", "right"] as const) {
      const hip: IAutoMovieVector3 = { ...bones.get(`${side}UpperLeg`)!.worldPosition };
      const knee: IAutoMovieVector3 = bones.get(`${side}LowerLeg`)!.worldPosition;
      const ankle: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
      const upper: number = distance(hip, knee);
      const lower: number = distance(knee, ankle);
      const rotation: IAutoMovieQuaternion = bones.get(`${side}Foot`)!.worldRotation;
      const reader: ReturnType<typeof HumanLegChain.prepareSeeded> = HumanLegChain.prepareSeeded(body, side, pelvis, hip);
      const pose: ReturnType<typeof HumanLegChain.prepare> = HumanLegChain.prepare(body, side, pelvis, hip);
      const targets: readonly IAutoMovieVector3[] = [
        placed(hip, { x: side === "left" ? 0.04 : -0.04, y: -(upper + lower - 0.08), z: 0.08 }, 37),
        placed(hip, { x: side === "left" ? 0.03 : -0.03, y: -(upper + lower - 0.1), z: 0.13 }, 37),
      ];
      const bend: IAutoMovieVector3 = placed(hip,
        { x: side === "left" ? 0.15 : -0.15, y: -upper, z: 0.45 }, 37);
      let initial: ReturnType<typeof HumanLegChain.seeded> | undefined;
      let earlier: HumanLegChain.IPosed | undefined;
      let originalKnee: IAutoMovieVector3 | undefined;
      for (const [index, width] of [[0, 0], [1, 0.01], [0, 0], [1, 0.001], [0, 0]] as const) {
        const near: IAutoMovieSwivelNear | undefined = width === 0 || initial === undefined || initial.seed === null
          ? undefined : { ...initial.seed, tolerance: width };
        const target: IAutoMovieVector3 = targets[index]!;
        const fitted: ReturnType<typeof HumanLegChain.seeded> = reader(target, bend, rotation, near);
        const shown: HumanLegChain.IPosed | null = pose(target, fitted.swivel);
        TestValidator.predicate("reachable prepared Human leg has an actual hinged pose and continuation seed",
          shown !== null && fitted.seed !== null,
        );
        if (shown === null) continue;
        const limb: "leftLeg" | "rightLeg" = `${side}Leg`;
        resolveHumanPosture.memory(false);
        const cold: IAutoMoviePose = resolveHumanPosture.seeded(body, {
          ...raw, limbs: { [limb]: { point: target, bend, rotation } },
        }, undefined, near === undefined ? {} : { [limb]: near }).pose;
        resolveHumanPosture.memory(true);
        const current: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, cold);
        TestValidator.predicate(`actual ${side} links retain fixed lengths and the current reached target`,
          nclose(distance(shown.hip, shown.knee), upper, 1e-9) &&
          nclose(distance(shown.knee, shown.ankle), lower, 1e-9) &&
          distance(shown.ankle, target) <= 0.001 &&
          distance(current.get(`${side}Foot`)!.worldPosition, target) <= 0.001,
        );
        TestValidator.predicate(`current ${side} target/near reconstructs the full actual fit's knee`,
          distance(shown.knee, current.get(`${side}LowerLeg`)!.worldPosition) <= 1e-6,
        );
        if (index === 0 && width === 0) {
          if (originalKnee === undefined) originalKnee = { ...shown.knee };
          TestValidator.predicate("returning cold A restores its independently owned knee",
            distance(shown.knee, originalKnee) <= 1e-9,
          );
        }
        if (earlier !== undefined)
          TestValidator.predicate("later geometry cannot repair or borrow the earlier caller output",
            earlier.knee.x === 123 && earlier.ankle.y === 456 && shown.knee !== earlier.knee &&
            shown.ankle !== earlier.ankle,
          );
        if (initial === undefined) initial = fitted;
        shown.knee.x = 123;
        shown.ankle.y = 456;
        earlier = shown;
      }

      const first: ReturnType<typeof HumanLegChain.seeded> = reader(targets[0]!, bend, rotation);
      const original: HumanLegChain.IPosed = pose(targets[0]!, first.swivel)!;
      const otherHip: IAutoMovieVector3 = { x: hip.x + 1, y: hip.y + 0.25, z: hip.z - 2 };
      const otherPelvis: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -61), pelvis,
      );
      const other: ReturnType<typeof HumanLegChain.prepare> = HumanLegChain.prepare(body, side, otherPelvis, otherHip);
      const otherTarget: IAutoMovieVector3 = placed(otherHip, {
        x: targets[0]!.x - hip.x, y: targets[0]!.y - hip.y, z: targets[0]!.z - hip.z,
      }, -61);
      const moved: HumanLegChain.IPosed = other(otherTarget, first.swivel)!;
      const expected: IAutoMovieVector3 = placed(otherHip, {
        x: original.knee.x - hip.x, y: original.knee.y - hip.y, z: original.knee.z - hip.z,
      }, -61);
      TestValidator.predicate("separate fixed hip/pelvis reader preserves literal rigid covariance",
        distance(moved.knee, expected) <= 1e-9 && distance(moved.ankle, otherTarget) <= 0.001 &&
        distance(pose(targets[0]!, first.swivel)!.knee, original.knee) <= 1e-9,
      );
    }
  } finally {
    resolveHumanPosture.memory(true);
  }
}

/** Independent rigid placement by an explicit right-handed world-Y matrix. */
function placed(origin: IAutoMovieVector3, local: IAutoMovieVector3, degrees: number): IAutoMovieVector3 {
  const radians: number = degrees * Math.PI / 180;
  return { x: origin.x + local.x * Math.cos(radians) + local.z * Math.sin(radians),
    y: origin.y + local.y,
    z: origin.z - local.x * Math.sin(radians) + local.z * Math.cos(radians) };
}

/** Euclidean metre residual, shared only by independent geometric assertions. */
function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
