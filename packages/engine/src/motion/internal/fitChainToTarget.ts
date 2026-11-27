import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMoviePose,
} from "@automovie/interface";

import { fitSeededChainToTarget } from "./fitSeededChainToTarget";

/**
 * Fit a reachable two-bone chain to a model-frame target under the rig's
 * effective ROM, retaining authored non-chain joints: the pose of
 * {@link fitSeededChainToTarget}, for a caller that continues no fit from it.
 */
export const fitChainToTarget: (
  props: IAutoMovieFitChainToTargetProps,
) => IAutoMoviePose = (
  input: IAutoMovieFitChainToTargetProps,
): IAutoMoviePose => fitSeededChainToTarget.fit(input).pose;
