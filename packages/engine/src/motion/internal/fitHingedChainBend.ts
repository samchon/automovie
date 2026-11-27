import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieSeededChainFit,
  IAutoMovieSolvedChainPlant,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../../kinematics/DEFAULT_JOINT_AXES";
import { Vector3 } from "../../math/Vector3";
import { PLANT_RESIDUAL_EPSILON } from "../PLANT_RESIDUAL_EPSILON";
import { fitHingedChainCandidate } from "./fitHingedChainCandidate";
import type { prepareChainFit } from "./prepareChainFit";
import { resolvePreparedChainEffector } from "./resolvePreparedChainEffector";

/*
 * Evaluate and admit the actual hinged candidate of a prepared two-bone fit.
 * This owns the same hinge gate, scoring, ROM clamp and post-clamp endpoint
 * check for ordinary cold search and explicit continuous-curve continuation. An
 * admitted result lies on the target's legal reachable shell within the
 * original residual bucket. It is not a global-score or orientation
 * certificate: final orientation and the curve's current goal checks remain
 * their owners'.
 * Parameter props: Actual model-metre target and unchanged workspace goal/source
 * fields, including the chosen cold or near policy.
 * Parameter workspace: Matching prepared source, rig and fixed clinical data.
 * Returns: The scored candidate and its admitted bend result, or null when no
 * hinge candidate applies; fitted is null if actual clamped FK misses its
 * legal shell.
 */
export function fitHingedChainBend(
  props: IAutoMovieFitChainToTargetProps,
  workspace: prepareChainFit.IWorkspace,
): {
  candidate: IAutoMovieSolvedChainPlant;
  fitted: IAutoMovieSeededChainFit | null;
} | null {
  const prepared: prepareChainFit.IWorkspace["prepared"] = workspace.prepared;
  if (
    prepared === null ||
    prepared.lowerDomain.constraint === null ||
    prepared.lowerDomain.constraint.abduction !== null
  )
    return null;
  const axes: IAutoMovieJointAxes =
    props.jointAxes?.[props.chain.lower] ?? DEFAULT_JOINT_AXES;
  const candidate: IAutoMovieSolvedChainPlant | null = fitHingedChainCandidate(
    props,
    prepared,
    axes,
    props.effectorRotation,
    workspace.rig,
  );
  if (candidate === null) return null;
  const upper: IAutoMovieJointPose = workspace.clamp(candidate.upper);
  const lower: IAutoMovieJointPose = workspace.clamp(candidate.lower);
  const residual: number = Vector3.distance(
    resolvePreparedChainEffector({
      prepared,
      upper,
      lower,
      jointAxes: props.jointAxes,
      restFrames: props.restFrames,
      rig: workspace.rig,
    }),
    props.target,
  );
  const admitted: boolean =
    Math.floor(
      Math.abs(residual - (candidate.shortfall ?? 0)) / PLANT_RESIDUAL_EPSILON,
    ) === 0;
  return {
    candidate,
    fitted: admitted
      ? {
          pose: workspace.pose(upper, lower),
          seed: candidate.seed ?? null,
          ...(candidate.value === undefined ? {} : { value: candidate.value }),
        }
      : null,
  };
}
