import { type IAutoMovieResolvePreparedChainEffectorResolvedPreparedEffectorProps } from "@automovie/interface";
import type {
  IAutoMovieChainBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { resolvePreparedChainLower } from "./resolvePreparedChainLower";
/**
 * Resolve the effector produced by two candidate clinical joints through a prepared chain, in the same model-metre frame as its target. Clinical axes/rest frames must match preparation and candidate inversion. A supplied lower frame must be the completed prefix for these exact same inputs.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Composes prepared root orientation with candidate upper articulation, rotates the captured lower offset, then applies prepared relative lower orientation and candidate lower articulation before the effector offset; this is the same two-stage FK as the full rig walk.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure resolvePreparedChainLower owns the shared two-joint prefix; this point reader adds the final fixed offset and shares an already resolved prefix with the complete chain-frame reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scores actual supplied candidate articulation rather than the ideal IK target; prepared descendant offsets preserve intermediate rest transforms instead of assuming canonical straight limbs.
 * @evidence contracts/development/common.md#meaningful-documentation States model-metre output, candidate-joint meaning and the unchanged clinical mapping requirement.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two joint quaternion conversions and a fixed number of vector/quaternion compositions take constant work per candidate, avoiding a full skeleton FK traversal.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All candidate-invariant offsets and relative rest orientation come from one completed preparation; only the two current articulations are recomputed unless the caller supplies that exact completed lower frame.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one newly composed vector and retains no candidate joints, prepared record, handle or search history.
 */
export const resolvePreparedChainEffector: (
  props: IAutoMovieResolvePreparedChainEffectorResolvedPreparedEffectorProps,
  lower?: IAutoMovieChainBone,
) => IAutoMovieVector3 = (
  props: IAutoMovieResolvePreparedChainEffectorResolvedPreparedEffectorProps,
  lower?: IAutoMovieChainBone,
): IAutoMovieVector3 => {
  const frame: IAutoMovieChainBone = lower ?? resolvePreparedChainLower(props);
  return Vector3.add(
    frame.worldPosition,
    Quaternion.rotateVector(frame.worldRotation, props.prepared.effectorOffset),
  );
};
