import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMovieHingedArmSwivel,
  IAutoMovieHingedChainGeometry,
  IAutoMovieJointAxes,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { basisOf } from "./basisOf";
import { prepareChainFit } from "./prepareChainFit";
import { readHingeRange } from "./readHingeRange";

/**
 * Prepare one hinged two-bone request for evaluation at chosen swivels: the
 * fit's own chain preparation, clinical bases, hinge range, swivel chain and
 * bend-branch roots, with no search.
 *
 * @param props The fit request.
 * @returns The prepared chain, or null when it is not a hinged two-bone chain (the mid joint's abduction is mobile) or is degenerate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the prepared parts and the null cases.
 * @evidence contracts/development/implementation.md#principled-implementation The same hinge gate, bases and hinge range the hinged fit uses (fitHingedChainBend, fitHingedChainCandidate), and the swivel chain of hingedArmSwivel over the prepared rest geometry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation shared by fitHingedChainAt and readHingedChainSeed.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Declines a non-hinged or degenerate chain instead of approximating it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One chain preparation and one branch root solve.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call prepares its own request.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned record borrows the request and owns its preparation until the caller drops it.
 */
export function prepareHingedChainAt(props: IAutoMovieFitChainToTargetProps): prepareHingedChainAt.IPrepared | null {
  const workspace: prepareChainFit.IWorkspace = prepareChainFit(props);
  const prepared: prepareChainFit.IWorkspace["prepared"] = workspace.prepared;
  if (prepared === null || prepared.lowerDomain.constraint === null ||
    prepared.lowerDomain.constraint.abduction !== null) return null;
  const axes: IAutoMovieJointAxes = props.jointAxes?.[props.chain.lower] ?? DEFAULT_JOINT_AXES;
  const upperBasis: IAutoMovieJointAxes =
    workspace.rig?.basis(props.chain.upper, "decomposeJointRotation axes") ??
    basisOf(props.jointAxes?.[props.chain.upper]);
  const lowerBasis: IAutoMovieJointAxes =
    workspace.rig?.basis(props.chain.lower, "decomposeJointRotation axes") ?? basisOf(axes);
  const range: { min: number; max: number } | null = readHingeRange(props, prepared, axes, lowerBasis);
  const chain: IAutoMovieHingedChainGeometry = {
    upper: prepared.upper,
    midOffset: prepared.lowerOffset,
    midRest: prepared.lowerRotation,
    endOffset: prepared.effectorOffset,
    hinge: axes.flexion,
    target: props.target,
    ...(range === null ? {} : { range }),
  };
  const branches: IAutoMovieHingedArmSwivel.IStop[] | null = hingedArmSwivel.branches(chain);
  if (branches === null || branches.length === 0) return null;
  return { workspace, prepared, upperBasis, lowerBasis, chain, branches };
}

/**
 * The prepared parts of {@link prepareHingedChainAt}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its role.
 * @evidence contracts/development/design.md#principled-representation The fit's workspace and rest geometry with its bases, swivel chain and bend roots.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members fitHingedChainAt and readHingedChainSeed read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the fit's own workspace and swivel records.
 */
export namespace prepareHingedChainAt {
  /** One prepared hinged request. */
  export interface IPrepared {
    /** The fit's chain workspace: clamp, pose writer and rig. */
    workspace: prepareChainFit.IWorkspace;

    /** Its rest geometry and clinical domains. */
    prepared: NonNullable<prepareChainFit.IWorkspace["prepared"]>;

    /** The root joint's clinical basis. */
    upperBasis: IAutoMovieJointAxes;

    /** The mid joint's clinical basis. */
    lowerBasis: IAutoMovieJointAxes;

    /** The swivel chain toward the request's target. */
    chain: IAutoMovieHingedChainGeometry;

    /** The bend branches in `hingedArmSwivel.branches` order, at least one. */
    branches: IAutoMovieHingedArmSwivel.IStop[];
  }
}
