import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieSwivelNear } from "../kinematics/IAutoMovieSwivelNear";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { wrapDegrees } from "../math/wrapDegrees";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import type { IAutoMovieSeededChainFit } from "./IAutoMovieSeededChainFit";
import type { IAutoMovieChainContinuationObserver } from "./IAutoMovieChainContinuationObserver";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { PLANT_RESIDUAL_EPSILON } from "./constants/PLANT_RESIDUAL_EPSILON";
import { orientChainEffector } from "./orientChainEffector";
import type { prepareChainFit } from "./prepareChainFit";
import { readHingeRange } from "./readHingeRange";
import { resolvePreparedChainFrames } from "./resolvePreparedChainFrames";

/**
 * Continue an explicit constrained curve through orientation-exact swivel roots.
 * The ordinary public cold scorer is unchanged. This policy requires a hinged
 * lower joint without distal twist, a native two-axis box effector, an
 * explicit pole and no reference/weight, strain or obstruction. A source owner must actually
 * admit its complete immutable source before calling it.
 *
 * A fixed hinge branch gives upper(psi)=U*cos(psi/2)+V*sin(psi/2).
 * Removing the actual fixed parent/lower/rest factors gives the requested
 * effector's same half-angle family. Two-axis rank-one intersection proposes
 * at most two swivels. Each is lifted into the existing near bracket and
 * independently clamped, oriented and checked through actual FK, ROM and
 * requested pole side. An ambiguous equal-distance branch declines. The
 * deterministic curve owner still checks phase events and actual continuity.
 *
 * @param props Current model-metre point, world rotation and unchanged goal/source fields.
 * @param workspace Matching actually admitted source and fixed clinical rig.
 * @param near The explicit curve's deterministic branch and degree swivel bracket.
 * @param observe Optional actual root-trial/accepted observations; never changes admission and releases with the call.
 * @returns The independently verified current oriented pose/seed, or null for ordinary near/cold fallback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States explicit policy eligibility, half-angle frames, proposal versus actual acceptance, degree/model-metre units, ambiguity and unsupported fallback.
 * @evidence contracts/development/implementation.md#principled-implementation Eberly's bilinear two-axis quaternion surface intersects the known harmonic swivel family through a scalar sinusoid. Quaternion conjugation is linear, so fixed inverse parent/lower/rest products give its two exact algebraic coefficients up to irrelevant common scale. Existing clamping/orientation and actual prepared FK verify every proposed answer; no sampled global objective certificate is assumed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure hingedArmSwivel owns branch/harmonic geometry; readHingeRange owns clinical range mapping; the projector owns two-axis coefficients and the shared math helper owns rank-one roots. This dispatcher owns only explicit curve candidate selection and actual feasibility, then the caller owns phase continuity/fallback.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No body, seed name, law, fixture, iteration cap, target substitute or enlarged physical tolerance selects a result. Current point uses the original PLANT_RESIDUAL_EPSILON and rotation/ROM use their existing degree tolerance. Unsupported objectives and uncertain roots decline rather than silently change their semantics; no global cold-score equivalence is claimed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One selected hinge branch and at most two actual roots replace repeated near probes and nested effector projections on eligible curves. Each candidate retains actual orientation plus an O(J) source-prefix/frame scan; no repeated full swivel sweep occurs here. End-to-end speedup remains unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the matching source rig, range, geometry, coefficient basis and fixed inverse are borrowed. The current harmonic family also supplies its original poser from the same completed branch aim. Every current point/rotation, post-clamp FK, changed joint and pole is checked anew. Previous poses are not returned or interpolated; near carries only the deterministic curve candidate.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One call owns a harmonic family, two transformed coefficients and at most two temporary oriented poses/frames. Only the selected independent pose/seed escapes; other candidates release on return/throw and no target history, global cache, handle or task is created.
 */
export function continueHingedOrientation(
  props: IFitChainToTargetProps,
  workspace: prepareChainFit.IWorkspace,
  near: IAutoMovieSwivelNear,
  observe?: IAutoMovieChainContinuationObserver,
): IAutoMovieSeededChainFit | null {
  const prepared: prepareChainFit.IWorkspace["prepared"] = workspace.prepared;
  if (prepared === null || props.effectorRotation === undefined ||
    props.obstruction !== undefined || props.strain !== undefined ||
    props.referencePose !== undefined || props.referenceWeight !== undefined ||
    props.bend === undefined || prepared.lowerDomain.constraint === null ||
    prepared.lowerDomain.constraint.abduction !== null) return null;
  const lowerBasis: IAutoMovieJointAxes = workspace.rig.basis(
    props.chain.lower, "decomposeJointRotation axes",
  );
  if (lowerBasis.twistPlacement === "distal") return null;
  const project: ReturnType<prepareChainFit.IRig["effectorProjection"]> =
    workspace.rig.effectorProjection();
  if (project.swivelCandidates === undefined) return null;
  const rawAxes: IAutoMovieJointAxes =
    props.jointAxes?.[props.chain.lower] ?? DEFAULT_JOINT_AXES;
  const range: { min: number; max: number } | null = workspace.rig.hingeRange(
    (): { min: number; max: number } | null =>
      readHingeRange(props, prepared, rawAxes, lowerBasis),
  );
  const target: hingedArmSwivel.IPreparedTarget | undefined =
    workspace.rig.hingedGeometry()?.target(props.target, range ?? undefined);
  if (target?.harmonic === undefined) return null;
  const branches: hingedArmSwivel.IStop[] | null = target.branches();
  if (branches === null) return null;
  const branch: number = Math.min(near.branch, branches.length - 1);
  const stop: hingedArmSwivel.IStop = branches[branch]!;
  if (stop.shortfall !== 0) return null;
  const harmonic: hingedArmSwivel.IHarmonic = target.harmonic(stop.theta);
  const lower: IAutoMovieJointPose = workspace.clamp({
    bone: props.chain.lower,
    ...decomposeJointRotationOnBasis(harmonic.lower, lowerBasis,
      props.restFrames?.[props.chain.lower], prepared.lowerDomain),
  });
  const lowerRotation: IAutoMovieQuaternion = jointToQuaternionOnBasis(
    lower, lowerBasis, props.restFrames?.[props.chain.lower],
  );
  const left: IAutoMovieQuaternion = Quaternion.multiply(
    workspace.rig.effectorRestInverse(),
    Quaternion.multiply(Quaternion.inverse(lowerRotation),
      Quaternion.inverse(prepared.lowerRotation)),
  );
  const right: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(prepared.upper.worldRotation), props.effectorRotation,
  );
  const cosine: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.multiply(left, conjugate(harmonic.cosine)), right,
  );
  const sine: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.multiply(left, conjugate(harmonic.sine)), right,
  );
  const proposed: ReturnType<NonNullable<typeof project.swivelCandidates>> =
    project.swivelCandidates(cosine, sine);
  if (proposed === null) return null;
  const angles: readonly number[] = proposed === "all" ? [near.swivel] : proposed;
  const upperBasis: IAutoMovieJointAxes = workspace.rig.basis(
    props.chain.upper, "decomposeJointRotation axes",
  );
  const poseAt: ReturnType<typeof hingedArmSwivel.pose> = harmonic.pose();
  const wanted: IAutoMovieQuaternion = Quaternion.normalize(props.effectorRotation);
  let best: IAutoMovieSeededChainFit | null = null;
  let distance: number = Infinity;
  let selected: number | undefined;
  for (const angle of angles) {
    const delta: number = wrapDegrees(angle - near.swivel);
    if (!(Math.abs(delta) < hingedArmSwivel.STEP)) continue;
    const swivel: number = delta === 0 ? near.swivel : near.swivel + delta;
    observe?.("orientationRootTrial");
    const raw: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> = poseAt(swivel);
    const upper: IAutoMovieJointPose = workspace.clamp({
      bone: props.chain.upper,
      ...decomposeJointRotationOnBasis(raw.upper, upperBasis,
        props.restFrames?.[props.chain.upper], prepared.upperDomain),
    });
    const pose: IAutoMoviePose = orientChainEffector(
      props, workspace.pose(upper, lower), prepared, workspace.rig,
    );
    const frames: ReturnType<typeof resolvePreparedChainFrames> = resolvePreparedChainFrames({
      prepared, joints: pose.joints, jointAxes: props.jointAxes,
      restFrames: props.restFrames, rig: workspace.rig,
    });
    if (!(Vector3.distance(frames.effector.worldPosition, props.target) < PLANT_RESIDUAL_EPSILON) ||
      !(Quaternion.angleAfterNormalize(frames.effector.worldRotation, wanted) * 180 / Math.PI <= ROM_TOLERANCE)) continue;
    if (pose.joints.some((joint: IAutoMovieJointPose): boolean =>
      (joint.bone === props.chain.upper || joint.bone === props.chain.lower || joint.bone === props.chain.effector) &&
      !(workspace.rig.overshoot(joint.bone)(joint) <= ROM_TOLERANCE))) continue;
    if (props.bend !== undefined && !samePole(prepared.upper.worldPosition,
      props.target, frames.lower.worldPosition, props.bend)) continue;
    const current: number = Math.abs(delta);
    if (current === distance && selected !== swivel) return null;
    if (current < distance) {
      best = { pose, seed: { branch, swivel } };
      distance = current;
      selected = swivel;
    }
  }
  if (best !== null) observe?.("orientationRootAccepted");
  return best;
}

/** Conjugation stays linear in the known homogeneous half-angle coefficients. */
function conjugate(value: IAutoMovieQuaternion): IAutoMovieQuaternion {
  return { x: -value.x, y: -value.y, z: -value.z, w: value.w };
}

/** Retain the requested bend hemisphere under the ordinary hint degeneracy gate. */
function samePole(root: IAutoMovieVector3, point: IAutoMovieVector3,
  knee: IAutoMovieVector3, hint: IAutoMovieVector3): boolean {
  const axis: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(point, root));
  const across: (value: IAutoMovieVector3) => IAutoMovieVector3 = (
    value: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const offset: IAutoMovieVector3 = Vector3.subtract(value, root);
    return Vector3.subtract(offset, Vector3.scale(axis, Vector3.dot(offset, axis)));
  };
  const asked: IAutoMovieVector3 = across(hint);
  return Vector3.length(asked) < 1e-9 || Vector3.dot(across(knee), asked) > 0;
}
