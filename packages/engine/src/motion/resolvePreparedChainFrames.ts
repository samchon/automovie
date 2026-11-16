import type {
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieChainBone } from "../kinematics/IAutoMovieChainBone";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { Quaternion } from "../math/Quaternion";
import type { ISolvePreparedChainPlantProps } from "./ISolvePreparedChainPlantProps";
import { resolvePreparedChainEffector } from "./resolvePreparedChainEffector";
import { resolvePreparedChainLower } from "./resolvePreparedChainLower";

/** Articulations to read under the exact same prepared parent/intermediate pose. */
interface IProps extends Pick<
  ISolvePreparedChainPlantProps,
  "prepared" | "jointAxes" | "restFrames"
> {
  /** Authored order is significant: the last record of each bone wins as in resolvePose. */
  joints: readonly IAutoMovieJointPose[];
}

/** Mid and effector world frames in the prepared model-metre frame. */
interface IFrames {
  /** Mid frame used to recover its articulation-free parent and orient the effector. */
  lower: IAutoMovieChainBone;

  /** Actual effector frame, including its own current articulation. */
  effector: IAutoMovieChainBone;
}

/**
 * Read a fitted chain's mid and effector frames without walking unrelated bones.
 * The root transform, ancestor pose and fixed intermediate joints must match
 * preparation; only the three chain articulations may differ. Clinical tables
 * must be the actual skeleton-merged tables used to prepare and fit the chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States frame, unchanged dependencies, clinical mapping and last-joint precedence, and distinguishes the two returned frames.
 * @evidence contracts/development/implementation.md#principled-implementation Every chain record is converted in authored order, including overwritten duplicates, and the last quaternion wins as in full FK. The shared two-joint prefix gives the mid frame, then captured fixed transforms and the admitted end articulation give the effector frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One joint scan owns authored-order admission and resolvePreparedChainLower.fromRotations owns the shared rigid prefix without converting the same records again; this reader alone adds the effector frame.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An invalid earlier chain duplicate still throws before a later record can overwrite it. Unchanged non-chain records were admitted during preparation. Missing articulations remain identity without admitting an unused basis, and no ideal target substitutes for actual FK.
 * @evidence contracts/development/implementation.md#efficient-algorithms One O(J) joint scan and one conversion per chain record, normally three, replace an O(J+B) full skeleton walk and bone map; duplicate admission is required by full FK and completed conversions are not repeated.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both returned frames share one completed lower prefix and their already admitted quaternions; pose-invariant parent and intermediate transforms are borrowed from the same fit's preparation rather than cached by mutable rig identity.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns only two returned frames and temporary quaternions; retains no pose, prepared record, history, process or resource handle after return.
 */
export function resolvePreparedChainFrames(props: IProps): IFrames {
  let upper: IAutoMovieJointPose | undefined;
  let lower: IAutoMovieJointPose | undefined;
  let upperArticulation: IAutoMovieQuaternion | undefined;
  let lowerArticulation: IAutoMovieQuaternion | undefined;
  let endArticulation: IAutoMovieQuaternion | undefined;

  // Full FK admits records before replacing a duplicate. The preparation
  // already admitted every unchanged non-chain record, so this scan must
  // still admit every possibly changed chain record in the original order.
  for (const joint of props.joints) {
    if (
      joint.bone !== props.prepared.chain.upper &&
      joint.bone !== props.prepared.chain.lower &&
      joint.bone !== props.prepared.chain.effector
    )
      continue;
    const articulation: IAutoMovieQuaternion = jointToQuaternion(
      joint,
      props.jointAxes?.[joint.bone],
      props.restFrames?.[joint.bone],
    );
    if (joint.bone === props.prepared.chain.upper) {
      upper = joint;
      upperArticulation = articulation;
    }
    if (joint.bone === props.prepared.chain.lower) {
      lower = joint;
      lowerArticulation = articulation;
    }
    if (joint.bone === props.prepared.chain.effector)
      endArticulation = articulation;
  }
  const candidate: Parameters<typeof resolvePreparedChainLower>[0] = {
    ...props,
    upper: upper ?? {
      bone: props.prepared.chain.upper,
      flexion: null,
      abduction: null,
      twist: null,
    },
    lower: lower ?? {
      bone: props.prepared.chain.lower,
      flexion: null,
      abduction: null,
      twist: null,
    },
  };
  const frame: IAutoMovieChainBone = resolvePreparedChainLower.fromRotations(
    props.prepared,
    upperArticulation ?? Quaternion.identity(),
    lowerArticulation ?? Quaternion.identity(),
  );
  return {
    lower: frame,
    effector: {
      worldPosition: resolvePreparedChainEffector(candidate, frame),
      worldRotation: Quaternion.multiply(
        Quaternion.multiply(
          frame.worldRotation,
          props.prepared.effectorBaseRotation,
        ),
        endArticulation ?? Quaternion.identity(),
      ),
    },
  };
}
