import { IAutoMovieJointPose, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ISolvePreparedChainPlantProps } from "./ISolvePreparedChainPlantProps";


/** Selected clinical joints read through the same prepared chain and frames. */
interface IResolvedPreparedEffectorProps extends Pick<
  ISolvePreparedChainPlantProps,
  "prepared" | "jointAxes" | "restFrames"
> {
  /** Candidate root clinical articulation after rig-ROM clamping. */
  upper: IAutoMovieJointPose;


  /** Candidate mid clinical articulation after the same clamping. */
  lower: IAutoMovieJointPose;
}

/**
 * Resolve the effector produced by two candidate clinical joints through a prepared chain, in the same model-metre frame as its target. Clinical axes/rest frames must match preparation and candidate inversion.
 *
 * @evidence contracts/common.md#principled-implementation Composes prepared root orientation with candidate upper articulation, rotates the captured lower offset, then applies prepared relative lower orientation and candidate lower articulation before the effector offset; this is the same two-stage FK as the full rig walk.
 * @evidence contracts/common.md#clear-and-simple-design A shared candidate-FK helper isolates the fast residual geometry from the bend search and keeps it tied to the prepared frame record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Scores actual supplied candidate articulation rather than the ideal IK target; prepared descendant offsets preserve intermediate rest transforms instead of assuming canonical straight limbs.
 * @evidence contracts/common.md#meaningful-documentation States model-metre output, candidate-joint meaning and the unchanged clinical mapping requirement.
 * @evidence contracts/performance.md#efficient-algorithms Two joint quaternion conversions and a fixed number of vector/quaternion compositions take constant work per candidate, avoiding a full skeleton FK traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work All candidate-invariant offsets and relative rest orientation come from one completed preparation; only the two current articulations are recomputed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one newly composed vector and retains no candidate joints, prepared record, handle or search history.
 */
export const resolvePreparedChainEffector: (props: IResolvedPreparedEffectorProps) => IAutoMovieVector3 = (
  props: IResolvedPreparedEffectorProps,
): IAutoMovieVector3 => {
  const upperRotation: IAutoMovieQuaternion = Quaternion.multiply(
    props.prepared.upper.worldRotation,
    jointToQuaternion(
      props.upper,
      props.jointAxes?.[props.prepared.chain.upper],
      props.restFrames?.[props.prepared.chain.upper],
    ),
  );
  const lowerPosition: IAutoMovieVector3 = Vector3.add(
    props.prepared.upper.worldPosition,
    Quaternion.rotateVector(upperRotation, props.prepared.lowerOffset),
  );
  const lowerRotation: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.multiply(upperRotation, props.prepared.lowerRotation),
    jointToQuaternion(
      props.lower,
      props.jointAxes?.[props.prepared.chain.lower],
      props.restFrames?.[props.prepared.chain.lower],
    ),
  );
  return Vector3.add(
    lowerPosition,
    Quaternion.rotateVector(lowerRotation, props.prepared.effectorOffset),
  );
};
