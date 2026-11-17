import type { IAutoMovieJointPose } from "../pose/IAutoMovieJointPose";
import type { IAutoMovieSolvePreparedChainPlantProps } from "./IAutoMovieSolvePreparedChainPlantProps";

/**
 * Selected clinical joints read through the same prepared chain and frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The prepared chain and its clinical/rest frames are borrowed from IAutoMovieSolvePreparedChainPlantProps; upper and lower are candidate clinical joint articulations after the same rig-ROM clamping, read by resolvePreparedChainEffector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolvePreparedChainEffectorResolvedPreparedEffectorProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
 * @evidence contracts/development/design.md#principled-representation The prepared chain and its clinical/rest frames are borrowed from IAutoMovieSolvePreparedChainPlantProps; upper and lower are candidate clinical joint articulations after the same rig-ROM clamping, read by resolvePreparedChainEffector. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolvePreparedChainEffectorResolvedPreparedEffectorProps contract belongs to interface; packages/engine/src/motion/resolvePreparedChainEffector.ts uses this boundary. Runtime computation remains with those consumers.
 */
export interface IAutoMovieResolvePreparedChainEffectorResolvedPreparedEffectorProps extends Pick<
  IAutoMovieSolvePreparedChainPlantProps,
  "prepared" | "jointAxes" | "restFrames"
> {
  /** Candidate root clinical articulation after rig-ROM clamping. */
  upper: IAutoMovieJointPose;

  /** Candidate mid clinical articulation after the same clamping. */
  lower: IAutoMovieJointPose;
}
