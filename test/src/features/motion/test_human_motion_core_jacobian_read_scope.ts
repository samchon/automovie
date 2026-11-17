import { Quaternion, Vector3, getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanJacobian,
  createHumanBody,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanFrame } from "../internal/motionHumanFrame";
import { nclose } from "../internal/nclose";

/**
 * Repeated Jacobian variables share one candidate's joint preparation while
 * every variable retains its own actual derivative and returned records.
 *
 * A canonical Human skeleton/profile is copied without changing its numeric
 * rig. Owned getters return the same elbow flexion bounds and count only
 * those bound reads. One-variable preparation supplies a positive baseline;
 * four repeated F/T variables must read the bounds no more often. This
 * observes bound work, not a count of numerical projections or a speedup.
 *
 * Scenarios:
 * 1. A55/T12, B75/T-8 and restored A use the same body and independent reads.
 *    Each read projects that current candidate and returns four motions in
 *    F/T/F/T order plus the actual clamped elbow record.
 * 2. Every motion's hand angular velocity and an off-origin point velocity
 *    match central differences of actual canonical full FK at +/-0.001
 *    clinical degrees, within the existing Jacobian bound 1e-6 per degree.
 *    The other hand's derivative is zero. Real frames are finite and unit.
 * 3. An earlier returned joint and angular vector may be changed by their
 *    caller. Another candidate and restored A still have their independent
 *    physical derivatives; later reads do not repair the earlier values.
 *
 * The rig, bounds, bases and rest frames remain numerically unchanged during
 * and between reads. Only candidate clinical angles and caller-owned output
 * records change. The wider geometric Jacobian matrix remains in its
 * existing test; this deferred unit isolates preparation and read lifetime.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents actual copied Human provenance, immutable numeric bounds, observed getter work rather than projection counts, candidate angles, world derivative frames, central-difference step/bound and returned-record ownership.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public HumanJacobian.read for single and repeated variables, verifies actual clamped records and ordered motion coverage, then compares every derivative with perturbed public resolution/FK and observes later reads after caller output mutation.
 * @evidence contracts/development/testing.md#independent-expectations Central differences of actual full FK supply hand angular/point derivatives; a joint in the left arm cannot move the right hand. The same numeric bounds return through owned getters, and a positive single-variable read is the work baseline, not a reimplementation of clamp preparation.
 * @evidence contracts/development/testing.md#distinguishing-cases Repeated F/T coordinates, three A/B/A candidates, an off-origin point, an unaffected hand, actual finite/unit frames, positive bound work and poisoned prior outputs distinguish dropped variables, stale candidate preparation, wrong final twists and escaping read-local state.
 * @evidence contracts/development/testing.md#execution-ownership One deferred in-memory unit owns a copied canonical rig, observational getters and returned records; it changes no shared body or foreign function and starts no runner, compiler, renderer or host.
 */
export function test_human_motion_core_jacobian_read_scope(): void {
  const findings: string[] = [];
  const source: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const skeleton: IAutoMovieSkeleton = structuredClone(source.skeleton);
  const lower: IAutoMovieBone | undefined = skeleton.bones.find(
    (bone: IAutoMovieBone): boolean => bone.bone === "leftLowerArm",
  );
  if (lower === undefined) throw new Error("The actual Human has no left elbow");
  const original: IAutoMovieJointConstraint | null = getConstraint(
    "leftLowerArm", lower.constraint ?? null,
  );
  if (original === null || original.flexion === null)
    throw new Error("The actual elbow lacks its flexion interval");
  const constraint: IAutoMovieJointConstraint = structuredClone(original);
  const flexion: IAutoMovieAngleRange | null = constraint.flexion;
  if (flexion === null) throw new Error("The copied elbow has no flexion range");
  const minimum: number = flexion.min;
  const maximum: number = flexion.max;
  let boundReads: number = 0;
  Object.defineProperties(flexion, {
    min: { enumerable: true, get: (): number => { boundReads++; return minimum; } },
    max: { enumerable: true, get: (): number => { boundReads++; return maximum; } },
  });
  lower.constraint = constraint;
  const body: IAutoMovieMotionHumanBody = createHumanBody(skeleton, structuredClone(source.profile));
  const entry: IAutoMovieMotionHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 37);
  const variables: readonly IAutoMovieMotionHumanJacobian.IVariable[] = [
    { kind: "angle", bone: "leftLowerArm", axis: 0 },
    { kind: "angle", bone: "leftLowerArm", axis: 2 },
    { kind: "angle", bone: "leftLowerArm", axis: 0 },
    { kind: "angle", bone: "leftLowerArm", axis: 2 },
  ];
  const offset: IAutoMovieVector3 = { x: 0.04, y: 0.06, z: -0.03 };
  const h: number = 1e-3;
  const limit: number = 1e-6;
  let poisonedJoint: IAutoMovieJointPose | undefined;
  let poisonedAngular: IAutoMovieVector3 | undefined;

  /** Resolve real full-body FK independently of the Jacobian preparation. */
  function posed(posture: IAutoMovieMotionHumanPosture): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, resolveHumanPosture(body, posture));
    motionHumanFrame(bones, "Jacobian read-scope finite difference");
    return bones;
  }

  /** An off-origin physical point also observes a twist about the forearm. */
  function point(bone: IAutoMovieResolvedBone): IAutoMovieVector3 {
    return Vector3.add(bone.worldPosition, Quaternion.rotateVector(bone.worldRotation, offset));
  }

  for (const [label, f, t] of [["A", 55, 12], ["B", 75, -8], ["restored A", 55, 12]] as const) {
    try {
      const posture: IAutoMovieMotionHumanPosture = {
        ...entry,
        limbs: {},
        joints: { ...entry.joints, leftLowerArm: [f, 0, t] },
      };
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = posed(posture);
      boundReads = 0;
      const single: ReturnType<typeof HumanJacobian.read> =
        HumanJacobian.read(body, posture, bones, variables.slice(0, 1));
      const baseline: number = boundReads;
      boundReads = 0;
      const reading: ReturnType<typeof HumanJacobian.read> =
        HumanJacobian.read(body, posture, bones, variables);
      const repeated: number = boundReads;
      if (!(baseline > 0 && repeated === baseline && single.motions.length === 1))
        findings.push(`${label}: bound work was ${repeated}, positive baseline ${baseline}`);
      const clamped: IAutoMovieJointPose | undefined = reading.clamped.get("leftLowerArm");
      if (!(reading.motions.length === 4 && reading.clamped.size === 1 && clamped !== undefined &&
        nclose(clamped.flexion ?? NaN, f, 1e-9) && nclose(clamped.twist ?? NaN, t, 1e-9)))
        findings.push(`${label}: current projected candidate or ordered motions are missing`);

      for (const [index, variable] of variables.entries()) {
        if (variable.kind !== "angle") throw new Error("Expected an elbow angle variable");
        const motion: IAutoMovieMotionHumanJacobian.IMotion | undefined = reading.motions[index];
        if (motion === undefined) {
          findings.push(`${label} column ${index}: the actual motion is missing`);
          continue;
        }
        const above: [number, number, number] = [f, 0, t];
        const below: [number, number, number] = [f, 0, t];
        above[variable.axis] += h;
        below[variable.axis] -= h;
        const a: IAutoMovieResolvedBone | undefined = posed({
          ...posture, joints: { ...posture.joints, leftLowerArm: above },
        }).get("leftHand");
        const b: IAutoMovieResolvedBone | undefined = posed({
          ...posture, joints: { ...posture.joints, leftLowerArm: below },
        }).get("leftHand");
        const hand: IAutoMovieResolvedBone | undefined = bones.get("leftHand");
        const other: IAutoMovieResolvedBone | undefined = bones.get("rightHand");
        if (a === undefined || b === undefined || hand === undefined || other === undefined)
          throw new Error("Actual full FK omitted a hand");
        const turn: IAutoMovieQuaternion = Quaternion.multiply(
          a.worldRotation, Quaternion.inverse(b.worldRotation),
        );
        const sine: number = Math.hypot(turn.x, turn.y, turn.z);
        const scale: number = sine === 0 ? 0 :
          (turn.w < 0 ? -1 : 1) * Math.atan2(sine, Math.abs(turn.w)) / (h * sine);
        const angular: IAutoMovieVector3 = { x: scale * turn.x, y: scale * turn.y, z: scale * turn.z };
        const linear: IAutoMovieVector3 = Vector3.scale(Vector3.subtract(point(a), point(b)), 1 / (2 * h));
        const actual: IAutoMovieVector3 = HumanJacobian.velocity(motion, "leftHand", point(hand));
        const angularError: number = Vector3.length(Vector3.subtract(motion.angular, angular));
        const linearError: number = Vector3.length(Vector3.subtract(actual, linear));
        const unaffected: number = Vector3.length(HumanJacobian.velocity(motion, "rightHand", point(other)));
        if (!(Number.isFinite(angularError) && angularError <= limit &&
          Number.isFinite(linearError) && linearError <= limit &&
          Number.isFinite(unaffected) && unaffected <= limit))
          findings.push(`${label} column ${index}: angular ${angularError}, point ${linearError}, other hand ${unaffected}`);
      }
      if (label === "A" && clamped !== undefined && reading.motions[0] !== undefined) {
        poisonedJoint = clamped;
        poisonedAngular = reading.motions[0].angular;
        poisonedJoint.flexion = 999;
        poisonedAngular.x = NaN;
      }
    } catch (error) {
      findings.push(`${label}: ${String(error)}`);
    }
  }
  if (!(poisonedJoint !== undefined && poisonedJoint.flexion === 999 &&
    poisonedAngular !== undefined && Number.isNaN(poisonedAngular.x)))
    findings.push("later reads changed a caller-owned earlier result");
  TestValidator.equals("Jacobian preparation belongs to one candidate read", findings, []);
}
