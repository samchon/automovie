import type {
  IAutoMovieBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieHingedArmSwivel,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
  IAutoMovieSeededChainFit,
  IAutoMovieVector3,
} from "@automovie/interface";

import { alternateRigJointAngles } from "../kinematics/alternateRigJointAngles";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { getConstraint } from "../rom/getConstraint";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { basisOf } from "./basisOf";
import { orientChainEffector } from "./orientChainEffector";
import { prepareHingedChainAt } from "./prepareHingedChainAt";

/**
 * A hinged two-bone chain posed at a prescribed swivel and bend branch, with no
 * search, score or continuation: the closed-form articulation a caller that
 * chooses its own swivel (an arm course) evaluates.
 *
 * The request is the fit's own (`IFitChainToTargetProps`); its `near`'s swivel
 * and branch, `strain`, reference and bend hint are not read, since the swivel
 * is given, while the `near`'s twist is continued by the final orientation
 * (`IAutoMovieSwivelSeed.twist`). Its `obstruction` is read once, at the placed
 * mid and end joints, exactly as the hinged fit reads a candidate
 * (`fitHingedChainCandidate`), so a caller can tell a placement that passes
 * through what the fit keeps clear of. The hinge angle of the chosen branch
 * comes from the span (`hingedArmSwivel.branches`, each branch stopped on the
 * legal shell when the target lies outside the hinge's range), the root is
 * aimed and turned by the swivel (`hingedArmSwivel.pose`), both joints are
 * decomposed through the fit's own clinical domains and clamped by its ROM
 * clamp, and a requested effector rotation is laid by the fit's own final
 * orientation (`orientChainEffector`: the distal twist split and the end
 * joint's range projection), the tail of the hinged fit for one candidate.
 *
 * The same swivel's joint angles before the range of motion applies are
 * `fitHingedChainAt.free`'s, read without placing the chain.
 *
 * @param props The fit request: source pose, chain, rig tables and target; an
 *   optional effector rotation.
 * @param swivel The swivel, degrees, in the frame `IAutoMovieSwivelNear` and
 *   the fit's seeds use.
 * @param branch The bend branch, 0 or 1; clamped to the branches the target
 *   has.
 * @returns The posed chain, its seed, the shortfall from the target on the
 *   legal shell, metres, whether the range of motion moved a joint off the
 *   swivel's pose, and the obstruction's reading there; null when the chain is
 *   not a hinged two-bone chain or is degenerate.
 */
export function fitHingedChainAt(
  props: IAutoMovieFitChainToTargetProps,
  swivel: number,
  branch: number,
): fitHingedChainAt.IPlaced | null {
  const at: prepareHingedChainAt.IPrepared | null = prepareHingedChainAt(props);
  if (at === null) return null;
  const index: number = Math.min(
    Math.max(0, Math.round(branch)),
    at.branches.length - 1,
  );
  const stop: IAutoMovieHingedArmSwivel.IStop = at.branches[index]!;
  const posed: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> =
    hingedArmSwivel.pose(at.chain, stop.theta)(swivel);
  const unclamped: readonly [IAutoMovieJointPose, IAutoMovieJointPose] =
    decomposed(props, at, posed);
  const upper: IAutoMovieJointPose = at.workspace.clamp(unclamped[0]);
  const lower: IAutoMovieJointPose = at.workspace.clamp(unclamped[1]);
  // Whether the range of motion moved either joint off the swivel's own
  // pose, which moves the end joint off the target.
  const moved = (a: IAutoMovieJointPose, b: IAutoMovieJointPose): boolean =>
    Math.abs((a.flexion ?? 0) - (b.flexion ?? 0)) > 1e-9 ||
    Math.abs((a.abduction ?? 0) - (b.abduction ?? 0)) > 1e-9 ||
    Math.abs((a.twist ?? 0) - (b.twist ?? 0)) > 1e-9;

  // The obstruction at the swivel's own mid and end joints in world space,
  // composed as the hinged fit composes a candidate's.
  let blocked: number = 0;
  if (props.obstruction !== undefined) {
    const turned: IAutoMovieQuaternion = Quaternion.multiply(
      at.prepared.upper.worldRotation,
      posed.upper,
    );
    const mid: IAutoMovieVector3 = Vector3.add(
      at.prepared.upper.worldPosition,
      Quaternion.rotateVector(turned, at.prepared.lowerOffset),
    );
    const end: IAutoMovieVector3 = Vector3.add(
      mid,
      Quaternion.rotateVector(
        Quaternion.multiply(
          Quaternion.multiply(turned, at.prepared.lowerRotation),
          posed.lower,
        ),
        at.prepared.effectorOffset,
      ),
    );
    blocked = props.obstruction(mid, end);
  }
  return {
    pose: orientChainEffector(
      props,
      at.workspace.pose(upper, lower),
      at.prepared,
      at.workspace.rig,
    ),
    seed: { swivel, branch: index },
    shortfall: stop.shortfall,
    clamped: moved(unclamped[0], upper) || moved(unclamped[1], lower),
    blocked,
  };
}

/**
 * The root's and the mid joint's clinical angles of a swivel's pose before the
 * range of motion applies, each decomposed on its prepared basis in its own
 * domain.
 */
function decomposed(
  props: IAutoMovieFitChainToTargetProps,
  at: prepareHingedChainAt.IPrepared,
  posed: ReturnType<ReturnType<typeof hingedArmSwivel.pose>>,
): readonly [IAutoMovieJointPose, IAutoMovieJointPose] {
  return [
    {
      bone: props.chain.upper,
      ...decomposeJointRotationOnBasis(
        posed.upper,
        at.upperBasis,
        props.restFrames?.[props.chain.upper],
        at.prepared.upperDomain,
      ),
    },
    {
      bone: props.chain.lower,
      ...decomposeJointRotationOnBasis(
        posed.lower,
        at.lowerBasis,
        props.restFrames?.[props.chain.lower],
        at.prepared.lowerDomain,
      ),
    },
  ];
}

/**
 * The end joint's angles at the swivel before its range applies: the requested
 * effector rotation relative to the mid bone posed by the hinge alone (no
 * distal twist), decomposed on the end joint's clinical basis in its own
 * domain, as `orientChainEffector` reads the same rotation before it splits the
 * twist and projects; null without a requested rotation.
 */
function freeEffector(
  props: IAutoMovieFitChainToTargetProps,
  at: prepareHingedChainAt.IPrepared,
  posed: ReturnType<ReturnType<typeof hingedArmSwivel.pose>>,
): IEffector | null {
  if (props.effectorRotation === undefined) return null;
  const effector: IAutoMovieFitChainToTargetProps["chain"]["effector"] =
    props.chain.effector;
  const lower: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.multiply(
      Quaternion.multiply(at.prepared.upper.worldRotation, posed.upper),
      at.prepared.lowerRotation,
    ),
    posed.lower,
  );
  const local: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      Quaternion.inverse(at.prepared.effectorBaseRotation),
      Quaternion.multiply(Quaternion.inverse(lower), props.effectorRotation),
    ),
  );
  const basis: IAutoMovieJointAxes =
    at.workspace.rig?.basis(effector, "decomposeJointRotation axes") ??
    basisOf(props.jointAxes?.[effector]);
  const bone: IAutoMovieBone | undefined = props.skeleton.bones.find(
    (b: IAutoMovieBone): boolean => b.bone === effector,
  );
  return {
    pose: {
      bone: effector,
      ...decomposeJointRotationOnBasis(
        local,
        basis,
        props.restFrames?.[effector],
        {
          bone: effector,
          constraint: getConstraint(effector, bone?.constraint ?? null),
        },
      ),
    },
    charts: charts(effector, local, basis, props.restFrames?.[effector]),
  };
}

/** The end joint's angles and both their Euler charts. */
interface IEffector {
  /** The reading the end joint's domain chooses. */
  pose: IAutoMovieJointPose;

  /** The principal and the alternate chart. */
  charts: fitHingedChainAt.Charts;
}

/**
 * A joint rotation's two Euler readings, clinical degrees: the principal chart
 * and the other triple that composes to the same rotation
 * (`alternateRigJointAngles`), each lifted through the joint's rest frame as
 * the decomposition lifts its own (`toClinicalAngle`). These are the two
 * families of solutions Tolani, Goswami and Badler 2000 (section 3.3) find for
 * the root's and the end joint's angles.
 */
function charts(
  bone: IAutoMovieJointPose["bone"],
  q: IAutoMovieQuaternion,
  basis: IAutoMovieJointAxes,
  frame: IAutoMovieRestFrame | undefined,
): fitHingedChainAt.Charts {
  const rig: IAutoMovieResolvedJointAngles = decomposeJointRotationOnBasis(
    q,
    basis,
  );
  // Right-handedness of the basis, as the decomposition reads it.
  const handed: 1 | -1 =
    Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  const other: IAutoMovieResolvedJointAngles = alternateRigJointAngles(
    rig,
    basis.rotationOrder === "flexion-abduction-twist"
      ? undefined
      : basis.twistPlacement,
    handed,
  );
  function lifted(angles: IAutoMovieResolvedJointAngles): IAutoMovieJointPose {
    return {
      bone,
      flexion: toClinicalAngle(angles.flexion, frame?.flexion),
      abduction: toClinicalAngle(angles.abduction, frame?.abduction),
      twist: toClinicalAngle(angles.twist, frame?.twist),
    };
  }
  return [lifted(rig), lifted(other)];
}

/** Companion types of `fitHingedChainAt`. */
export namespace fitHingedChainAt {
  /** A chain placed at a swivel. */
  export interface IPlaced extends IAutoMovieSeededChainFit {
    /** How far the target lies beyond the branch's legal shell, metres. */
    shortfall: number;

    /** Whether the range of motion moved a joint off the swivel's own pose. */
    clamped: boolean;

    /**
     * The request's obstruction read at the swivel's own mid and end joints
     * (`IAutoMovieFitChainToTargetProps.obstruction`); 0 without one, positive
     * where the chain passes through what the fit keeps clear of.
     */
    blocked: number;
  }

  /**
   * A hinged chain's joint angles at a swivel and bend branch before the range
   * of motion applies, with no placement, clamp or projection: the root's and
   * the mid joint's decomposition of the swivel's pose, as `fitHingedChainAt`
   * decomposes them before its clamp, and, for a requested effector rotation,
   * the end joint's rotation relative to the hinge-only mid bone decomposed on
   * the end joint's clinical basis, as `orientChainEffector` reads that
   * rotation before it splits the twist and projects. These are the angles
   * theta_1 to theta_7 of Tolani, Goswami and Badler 2000 (Graphical Models
   * 62:353, sections 3.2.3 and 3.2.4) at the swivel, the elbow a pure hinge
   * (theta_4) and the wrist's three angles read as one spherical joint, which a
   * caller choosing the swivel and a free turn of the end rotation compares
   * with the joints' ranges (section 3.3, "Joint limits").
   *
   * @param props The fit request: source pose, chain, rig tables and target; an
   *   optional effector rotation.
   * @param swivel The swivel, degrees, in the frame `IAutoMovieSwivelNear` and
   *   the fit's seeds use.
   * @param branch The bend branch, 0 or 1; clamped to the branches the target
   *   has.
   * @returns The angles, clinical degrees; null when the chain is not a hinged
   *   two-bone chain or is degenerate.
   */
  export function free(
    props: IAutoMovieFitChainToTargetProps,
    swivel: number,
    branch: number,
  ): IFree | null {
    const at: prepareHingedChainAt.IPrepared | null =
      prepareHingedChainAt(props);
    if (at === null) return null;
    const index: number = Math.min(
      Math.max(0, Math.round(branch)),
      at.branches.length - 1,
    );
    const posed: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> =
      hingedArmSwivel.pose(at.chain, at.branches[index]!.theta)(swivel);
    const [upper, lower]: readonly [IAutoMovieJointPose, IAutoMovieJointPose] =
      decomposed(props, at, posed);
    const effector: IEffector | null = freeEffector(props, at, posed);
    return {
      upper,
      lower,
      effector: effector?.pose ?? null,
      charts: {
        upper: charts(
          props.chain.upper,
          posed.upper,
          at.upperBasis,
          props.restFrames?.[props.chain.upper],
        ),
        effector: effector?.charts ?? null,
      },
    };
  }

  /**
   * A chain's joint angles at a swivel before the range of motion applies:
   * Tolani, Goswami and Badler's theta_1 to theta_7 (2000, sections 3.2.3 and
   * 3.2.4), clinical degrees, the end joint's three read as one spherical joint
   * on its own basis.
   */
  export interface IFree {
    /** The root joint (theta_1 to theta_3). */
    upper: IAutoMovieJointPose;

    /** The mid joint, its hinge only (theta_4). */
    lower: IAutoMovieJointPose;

    /**
     * The end joint relative to the hinge-only mid bone (theta_5 to theta_7),
     * its twist the distal twist the mid bone takes on a limb that twists
     * distally; null without a requested effector rotation.
     */
    effector: IAutoMovieJointPose | null;

    /**
     * Both Euler charts of the root and the end joint (Tolani, Goswami and
     * Badler 2000, section 3.3: two families of solutions for each, so four
     * combinations), each read without a range: the principal and the
     * alternate, in that order.
     */
    charts: ICharts;
  }

  /** A joint's two Euler readings: the principal chart, then the alternate. */
  export type Charts = readonly [IAutoMovieJointPose, IAutoMovieJointPose];

  /** The root's and the end joint's two Euler readings. */
  export interface ICharts {
    /** The root joint's (theta_1 to theta_3). */
    upper: Charts;

    /** The end joint's (theta_5 to theta_7); null without an effector rotation. */
    effector: Charts | null;
  }
}
