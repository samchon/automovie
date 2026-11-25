import type { IAutoMovieJointPose } from "../pose/IAutoMovieJointPose";
import type { IAutoMoviePrepareChainFit } from "./IAutoMoviePrepareChainFit";
import type { IAutoMovieSolvePreparedChainPlantProps } from "./IAutoMovieSolvePreparedChainPlantProps";

/** Selected clinical joints read through the same prepared chain and frames. */
export interface IAutoMovieResolvePreparedChainEffectorResolvedPreparedEffectorProps extends Pick<
  IAutoMovieSolvePreparedChainPlantProps,
  "prepared" | "jointAxes" | "restFrames"
> {
  /** Candidate root clinical articulation after rig-ROM clamping. */
  upper: IAutoMovieJointPose;

  /** Candidate mid clinical articulation after the same clamping. */
  lower: IAutoMovieJointPose;

  /**
   * Optional matching call-local basis preparation, shared with the inverse
   * solve.
   */
  rig?: IAutoMoviePrepareChainFit.IRig;
}
