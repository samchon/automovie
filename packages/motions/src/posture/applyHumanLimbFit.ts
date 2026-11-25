import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanLimbView } from "./HumanLimbView";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { solveHumanLimbFit } from "./solveHumanLimbFit";

/**
 * The limb fit an ordered refit applies (`refitHumanPosture`), the paired arms'
 * own fits (`HumanLimbPair`) and a leg probe (`HumanLegChain`), solved directly
 * by `solveHumanLimbFit` with no memory of earlier fits. The result shares the
 * records the fit leaves unchanged with the input pose, which every caller owns
 * or treats as immutable. A refit passes the admission its limbs share
 * (`HumanLimbView.IAdmission`), so the whole pose is admitted once for them.
 */
export function applyHumanLimbFit(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
  goal: IAutoMovieHumanLimbGoal,
  placed: readonly AutoMovieHumanSide[],
  rival?: IAutoMovieVector3,
  near?: IAutoMovieSwivelNear,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  admission?: HumanLimbView.IAdmission,
): IAutoMovieSeededChainFit {
  return solveHumanLimbFit(
    body,
    pose,
    limb,
    goal,
    placed,
    rival,
    near,
    resolution,
    "ordinary",
    admission,
  );
}

/** The owned continuous curve's limb fit. */
export namespace applyHumanLimbFit {
  /**
   * The owned continuous curve's fit: the direct solve under the current hinged
   * correction.
   */
  export function continued(
    ...args: Parameters<typeof applyHumanLimbFit>
  ): ReturnType<typeof applyHumanLimbFit> {
    return solveHumanLimbFit(
      args[0],
      args[1],
      args[2],
      args[3],
      args[4],
      args[5],
      args[6],
      args[7],
      "continuous",
      args[8],
    );
  }
}
