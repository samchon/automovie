import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMovieHingedArmSwivel,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineDefaultJointAxes } from "../../kinematics/AutoMovieEngineDefaultJointAxes";
import { decomposeJointRotationOnBasis } from "../../kinematics/internal/decomposeJointRotationOnBasis";
import { AutoMovieEngineHingedArmSwivel } from "../../kinematics/AutoMovieEngineHingedArmSwivel";
import { jointToQuaternionOnBasis } from "../../kinematics/internal/jointToQuaternionOnBasis";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { wrapDegrees } from "../../math/internal/wrapDegrees";
import { AutoMovieEngineRomTolerance } from "../../rom/AutoMovieEngineRomTolerance";
import type { IAutoMovieChainContinuationObserver } from "../IAutoMovieChainContinuationObserver";
import { AutoMovieEnginePlantResidualEpsilon } from "../AutoMovieEnginePlantResidualEpsilon";
import { orientChainEffector } from "./orientChainEffector";
import type { prepareChainFit } from "./prepareChainFit";
import { readHingeRange } from "./readHingeRange";
import { resolvePreparedChainFrames } from "./resolvePreparedChainFrames";

/*
 * Continue an explicit constrained curve through orientation-exact swivel
 * roots. The ordinary public cold scorer is unchanged. This policy requires a
 * hinged lower joint without distal twist, a native two-axis box effector, an
 * explicit pole and no reference/weight, strain or obstruction. A source owner
 * must actually admit its complete immutable source before calling it.
 *
 * A fixed hinge branch gives upper(psi)=U_cos(psi/2)+V_sin(psi/2). Removing the
 * actual fixed parent/lower/rest factors gives the requested effector's same
 * half-angle family. Two-axis rank-one intersection proposes at most two
 * swivels. Each is lifted into the existing near bracket and independently
 * clamped, oriented and checked through actual FK, ROM and requested pole side.
 * An ambiguous equal-distance branch declines. The deterministic curve owner
 * still checks phase events and actual continuity.
 * Parameter props: Current model-metre point, world rotation and unchanged
 * goal/source fields.
 * Parameter workspace: Matching actually admitted source and fixed clinical rig.
 * Parameter near: The explicit curve's deterministic branch and degree swivel
 * bracket.
 * Parameter observe: Optional actual root-trial/accepted observations; never
 * changes admission and releases with the call.
 * Returns: The independently verified current oriented pose/seed, or null for
 * ordinary near/cold fallback.
 */
export function continueHingedOrientation(
  props: IAutoMovieFitChainToTargetProps,
  workspace: prepareChainFit.IWorkspace,
  near: IAutoMovieSwivelNear,
  observe?: IAutoMovieChainContinuationObserver,
): IAutoMovieSeededChainFit | null {
  const prepared: prepareChainFit.IWorkspace["prepared"] = workspace.prepared;
  if (
    prepared === null ||
    props.effectorRotation === undefined ||
    props.obstruction !== undefined ||
    props.strain !== undefined ||
    props.referencePose !== undefined ||
    props.referenceWeight !== undefined ||
    props.bend === undefined ||
    prepared.lowerDomain.constraint === null ||
    prepared.lowerDomain.constraint.abduction !== null
  )
    return null;
  const lowerBasis: IAutoMovieJointAxes = workspace.rig.basis(
    props.chain.lower,
    "decomposeJointRotation axes",
  );
  if (lowerBasis.twistPlacement === "distal") return null;
  const project: ReturnType<prepareChainFit.IRig["effectorProjection"]> =
    workspace.rig.effectorProjection();
  if (project.swivelCandidates === undefined) return null;
  const rawAxes: IAutoMovieJointAxes =
    props.jointAxes?.[props.chain.lower] ?? AutoMovieEngineDefaultJointAxes;
  const range: { min: number; max: number } | null = workspace.rig.hingeRange(
    (): { min: number; max: number } | null =>
      readHingeRange(props, prepared, rawAxes, lowerBasis),
  );
  const target: AutoMovieEngineHingedArmSwivel.IPreparedTarget | undefined = workspace.rig
    .hingedGeometry()
    ?.target(props.target, range ?? undefined);
  if (target?.harmonic === undefined) return null;
  const branches: IAutoMovieHingedArmSwivel.IStop[] | null = target.branches();
  if (branches === null) return null;
  const branch: number = Math.min(near.branch, branches.length - 1);
  const stop: IAutoMovieHingedArmSwivel.IStop = branches[branch]!;
  if (stop.shortfall !== 0) return null;
  const harmonic: AutoMovieEngineHingedArmSwivel.IHarmonic = target.harmonic(stop.theta);
  const lower: IAutoMovieJointPose = workspace.clamp({
    bone: props.chain.lower,
    ...decomposeJointRotationOnBasis.run(
      harmonic.lower,
      lowerBasis,
      props.restFrames?.[props.chain.lower],
      prepared.lowerDomain,
    ),
  });
  const lowerRotation: IAutoMovieQuaternion = jointToQuaternionOnBasis.run(
    lower,
    lowerBasis,
    props.restFrames?.[props.chain.lower],
  );
  const left: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    workspace.rig.effectorRestInverse(),
    AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.inverse(lowerRotation),
      AutoMovieEngineQuaternion.inverse(prepared.lowerRotation),
    ),
  );
  const right: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.inverse(prepared.upper.worldRotation),
    props.effectorRotation,
  );
  const cosine: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.multiply(left, conjugate(harmonic.cosine)),
    right,
  );
  const sine: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.multiply(left, conjugate(harmonic.sine)),
    right,
  );
  const proposed: ReturnType<NonNullable<typeof project.swivelCandidates>> =
    project.swivelCandidates(cosine, sine);
  if (proposed === null) return null;
  const angles: readonly number[] =
    proposed === "all" ? [near.swivel] : proposed;
  const upperBasis: IAutoMovieJointAxes = workspace.rig.basis(
    props.chain.upper,
    "decomposeJointRotation axes",
  );
  const poseAt: ReturnType<typeof AutoMovieEngineHingedArmSwivel.pose> = harmonic.pose();
  const wanted: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
    props.effectorRotation,
  );
  let best:
    | (IAutoMovieSeededChainFit & continueHingedOrientation.IRooted)
    | null = null;
  let distance: number = Infinity;
  let selected: number | undefined;
  let trials: number = 0;
  let accepted: number = 0;
  for (const angle of angles) {
    const delta: number = wrapDegrees(angle - near.swivel);
    if (!(Math.abs(delta) < AutoMovieEngineHingedArmSwivel.STEP)) continue;
    const swivel: number = delta === 0 ? near.swivel : near.swivel + delta;
    trials++;
    observe?.("orientationRootTrial");
    const raw: ReturnType<ReturnType<typeof AutoMovieEngineHingedArmSwivel.pose>> =
      poseAt(swivel);
    const upper: IAutoMovieJointPose = workspace.clamp({
      bone: props.chain.upper,
      ...decomposeJointRotationOnBasis.run(
        raw.upper,
        upperBasis,
        props.restFrames?.[props.chain.upper],
        prepared.upperDomain,
      ),
    });
    const pose: IAutoMoviePose = orientChainEffector(
      props,
      workspace.pose(upper, lower),
      prepared,
      workspace.rig,
    );
    const frames: ReturnType<typeof resolvePreparedChainFrames> =
      resolvePreparedChainFrames({
        prepared,
        joints: pose.joints,
        jointAxes: props.jointAxes,
        restFrames: props.restFrames,
        rig: workspace.rig,
      });
    if (
      !(
        AutoMovieEngineVector3.distance(frames.effector.worldPosition, props.target) <
        AutoMovieEnginePlantResidualEpsilon
      ) ||
      !(
        (AutoMovieEngineQuaternion.angleAfterNormalize(frames.effector.worldRotation, wanted) *
          180) /
          Math.PI <=
        AutoMovieEngineRomTolerance
      )
    )
      continue;
    if (
      pose.joints.some(
        (joint: IAutoMovieJointPose): boolean =>
          (joint.bone === props.chain.upper ||
            joint.bone === props.chain.lower ||
            joint.bone === props.chain.effector) &&
          !(workspace.rig.overshoot(joint.bone)(joint) <= AutoMovieEngineRomTolerance),
      )
    )
      continue;
    if (
      props.bend !== undefined &&
      !samePole(
        prepared.upper.worldPosition,
        props.target,
        frames.lower.worldPosition,
        props.bend,
      )
    )
      continue;
    accepted++;
    const current: number = Math.abs(delta);
    if (current === distance && selected !== swivel) return null;
    if (current < distance) {
      const twist: number | null | undefined = pose.joints.find(
        (joint: IAutoMovieJointPose): boolean =>
          joint.bone === props.chain.lower,
      )?.twist;
      best = {
        pose,
        seed: {
          branch,
          swivel,
          ...(typeof twist === "number" ? { twist } : {}),
        },
      };
      distance = current;
      selected = swivel;
    }
  }
  if (
    best !== null &&
    best.seed !== null &&
    proposed !== "all" &&
    accepted === 1
  ) {
    best.rooted = {
      branch: best.seed.branch,
      swivel: best.seed.swivel,
      proposals: proposed.length,
      trials,
      accepted,
    };
  }
  if (best !== null) observe?.("orientationRootAccepted");
  return best;
}

/*
 * Read-only provenance of the actual uniquely admitted root return.
 */
export namespace continueHingedOrientation {
  /** Actual local uniqueness and work facts; no trajectory or goal is certified. */
  export interface IRoot {
    /** Selected hinge branch of this actual result. */
    readonly branch: number;
    /** Selected swivel in degrees, including its original zero sign. */
    readonly swivel: number;
    /** Finite isolated roots proposed over the full swivel turn. */
    readonly proposals: number;
    /** In-bracket roots actually sent through physical verification. */
    readonly trials: number;
    /** Physically admitted in-bracket candidates; always one for an issued read. */
    readonly accepted: number;
  }

  /*
   * Return copied facts only for this actual result with unchanged pose and
   * seed.
   */
  export function root(
    result: IAutoMovieSeededChainFit & IRooted,
  ): IRoot | undefined {
    return result.rooted === undefined ? undefined : { ...result.rooted };
  }

  /** A uniquely admitted root return carries its facts. */
  export interface IRooted {
    /** Set by the continuation on the one result it admits. */
    rooted?: IRoot;
  }
}

/*
 * Conjugation stays linear in the known homogeneous half-angle coefficients.
 */
function conjugate(value: IAutoMovieQuaternion): IAutoMovieQuaternion {
  return { x: -value.x, y: -value.y, z: -value.z, w: value.w };
}

/*
 * Retain the requested bend hemisphere under the ordinary hint degeneracy gate.
 */
function samePole(
  root: IAutoMovieVector3,
  point: IAutoMovieVector3,
  knee: IAutoMovieVector3,
  hint: IAutoMovieVector3,
): boolean {
  const axis: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(point, root),
  );
  const across: (value: IAutoMovieVector3) => IAutoMovieVector3 = (
    value: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const offset: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(value, root);
    return AutoMovieEngineVector3.subtract(
      offset,
      AutoMovieEngineVector3.scale(axis, AutoMovieEngineVector3.dot(offset, axis)),
    );
  };
  const asked: IAutoMovieVector3 = across(hint);
  return AutoMovieEngineVector3.length(asked) < 1e-9 || AutoMovieEngineVector3.dot(across(knee), asked) > 0;
}
