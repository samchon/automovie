import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMovieHingedArmSwivel,
  IAutoMovieHingedChainGeometry,
  IAutoMovieJointAxes,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../../kinematics/DEFAULT_JOINT_AXES";
import { hingedArmSwivel } from "../../kinematics/hingedArmSwivel";
import { basisOf } from "./basisOf";
import { prepareChainFit } from "./prepareChainFit";
import { readHingeRange } from "./readHingeRange";

/*
 * Prepare one hinged two-bone request for evaluation at chosen swivels: the
 * fit's own chain preparation, clinical bases, hinge range, swivel chain and
 * bend-branch roots, with no search.
 * Parameter props: The fit request.
 * Returns: The prepared chain, or null when it is not a hinged two-bone chain
 * (the mid joint's abduction is mobile) or is degenerate.
 */
export function prepareHingedChainAt(
  props: IAutoMovieFitChainToTargetProps,
): prepareHingedChainAt.IPrepared | null {
  const workspace: prepareChainFit.IWorkspace = prepareChainFit(props);
  const prepared: prepareChainFit.IWorkspace["prepared"] = workspace.prepared;
  if (
    prepared === null ||
    prepared.lowerDomain.constraint === null ||
    prepared.lowerDomain.constraint.abduction !== null
  )
    return null;
  const axes: IAutoMovieJointAxes =
    props.jointAxes?.[props.chain.lower] ?? DEFAULT_JOINT_AXES;
  const upperBasis: IAutoMovieJointAxes =
    workspace.rig?.basis(props.chain.upper, "decomposeJointRotation axes") ??
    basisOf(props.jointAxes?.[props.chain.upper]);
  const lowerBasis: IAutoMovieJointAxes =
    workspace.rig?.basis(props.chain.lower, "decomposeJointRotation axes") ??
    basisOf(axes);
  const range: { min: number; max: number } | null = readHingeRange(
    props,
    prepared,
    axes,
    lowerBasis,
  );
  const chain: IAutoMovieHingedChainGeometry = {
    upper: prepared.upper,
    midOffset: prepared.lowerOffset,
    midRest: prepared.lowerRotation,
    endOffset: prepared.effectorOffset,
    hinge: axes.flexion,
    target: props.target,
    ...(range === null ? {} : { range }),
  };
  const branches: IAutoMovieHingedArmSwivel.IStop[] | null =
    hingedArmSwivel.branches(chain);
  if (branches === null || branches.length === 0) return null;
  return { workspace, prepared, upperBasis, lowerBasis, chain, branches };
}

/*
 * The prepared parts of prepareHingedChainAt.
 */
export namespace prepareHingedChainAt {
  /*
   * One prepared hinged request.
   */
  export interface IPrepared {
    /*
     * The fit's chain workspace: clamp, pose writer and rig.
     */
    workspace: prepareChainFit.IWorkspace;

    /*
     * Its rest geometry and clinical domains.
     */
    prepared: NonNullable<prepareChainFit.IWorkspace["prepared"]>;

    /*
     * The root joint's clinical basis.
     */
    upperBasis: IAutoMovieJointAxes;

    /*
     * The mid joint's clinical basis.
     */
    lowerBasis: IAutoMovieJointAxes;

    /*
     * The swivel chain toward the request's target.
     */
    chain: IAutoMovieHingedChainGeometry;

    /*
     * The bend branches in `hingedArmSwivel.branches` order, at least one.
     */
    branches: IAutoMovieHingedArmSwivel.IStop[];
  }
}
