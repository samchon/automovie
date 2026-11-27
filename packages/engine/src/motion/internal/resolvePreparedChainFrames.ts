import type {
  IAutoMovieChainBone,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieSolvePreparedChainPlantProps,
} from "@automovie/interface";

import { jointToQuaternion } from "../../kinematics/internal/jointToQuaternion";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import type { prepareChainFit } from "./prepareChainFit";
import { resolvePreparedChainEffector } from "./resolvePreparedChainEffector";
import { resolvePreparedChainLower } from "./resolvePreparedChainLower";

/*
 * Read a fitted chain's mid and effector frames without walking unrelated
 * bones. The root transform, ancestor pose and fixed intermediate joints must
 * match preparation; only the three chain articulations may differ. Clinical
 * tables must be the actual skeleton-merged tables used to prepare and fit the
 * chain.
 */
export function resolvePreparedChainFrames(props: IProps): IFrames {
  const reading: IReading = read(props);
  const candidate: Parameters<typeof resolvePreparedChainLower>[0] = {
    ...props,
    upper: reading.upperJoint ?? {
      bone: props.prepared.chain.upper,
      flexion: null,
      abduction: null,
      twist: null,
    },
    lower: reading.lowerJoint ?? {
      bone: props.prepared.chain.lower,
      flexion: null,
      abduction: null,
      twist: null,
    },
  };
  return {
    lower: reading.lower,
    effector: {
      worldPosition: resolvePreparedChainEffector(candidate, reading.lower),
      worldRotation: effectorRotation(props, reading),
    },
  };
}

/*
 * Complete frames, a lower frame or an effector rotation after the same
 * admission.
 */
export namespace resolvePreparedChainFrames {
  /*
   * Read only the lower frame after admitting every chain record, including
   * overwritten or otherwise unused end records, in authored order. The
   * preparation, root, non-chain pose and clinical mapping premises of the
   * complete-frame entry apply unchanged. Returns one fresh lower frame.
   */
  export function lower(props: IProps): IAutoMovieChainBone {
    return read(props).lower;
  }

  /*
   * Read only the actual effector world rotation after the identical complete
   * chain admission and lower prefix. The same stable prepared-input premises
   * apply; no effector world position or full-frame adapter is assembled.
   */
  export function rotation(props: IProps): IAutoMovieQuaternion {
    return effectorRotation(props, read(props));
  }
}

/*
 * Compose the actual end articulation through the same captured fixed frame for
 * every rotation reader.
 */
function effectorRotation(
  props: IProps,
  reading: IReading,
): IAutoMovieQuaternion {
  return AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.multiply(
      reading.lower.worldRotation,
      props.prepared.effectorBaseRotation,
    ),
    reading.endArticulation ?? AutoMovieEngineQuaternion.identity(),
  );
}

/*
 * Admit every changed chain record before composing the shared lower prefix.
 */
function read(props: IProps): IReading {
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
    const articulation: IAutoMovieQuaternion =
      props.rig === undefined
        ? jointToQuaternion(
            joint,
            props.jointAxes?.[joint.bone],
            props.restFrames?.[joint.bone],
          )
        : props.rig.composer(joint.bone, props.restFrames?.[joint.bone])(joint);
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
  const frame: IAutoMovieChainBone = resolvePreparedChainLower.fromRotations(
    props.prepared,
    upperArticulation ?? AutoMovieEngineQuaternion.identity(),
    lowerArticulation ?? AutoMovieEngineQuaternion.identity(),
  );
  return {
    lower: frame,
    upperJoint: upper,
    lowerJoint: lower,
    endArticulation,
  };
}

/*
 * Articulations to read under the exact same prepared parent/intermediate pose.
 */
interface IProps extends Pick<
  IAutoMovieSolvePreparedChainPlantProps,
  "prepared" | "jointAxes" | "restFrames"
> {
  /*
   * Authored order is significant: the last record of each bone wins as in
   * resolvePose.
   */
  joints: readonly IAutoMovieJointPose[];

  /*
   * Optional lazy basis owner of this same prepared rig; record admission order
   * is unchanged.
   */
  rig?: prepareChainFit.IRig;
}

/*
 * Mid and effector world frames in the prepared model-metre frame.
 */
interface IFrames {
  /*
   * Mid frame used to recover its articulation-free parent and orient the
   * effector.
   */
  lower: IAutoMovieChainBone;

  /*
   * Actual effector frame, including its own current articulation.
   */
  effector: IAutoMovieChainBone;
}

/*
 * Completed ordered admission and the shared lower prefix; no effector frame is
 * assembled here.
 */
interface IReading {
  /*
   * Fresh lower world frame composed from the admitted last articulations.
   */
  lower: IAutoMovieChainBone;

  /*
   * Last upper record, retained only for the full point-reader adapter.
   */
  upperJoint: IAutoMovieJointPose | undefined;

  /*
   * Last lower record, retained only for that same adapter.
   */
  lowerJoint: IAutoMovieJointPose | undefined;

  /*
   * Last end quaternion, after every end duplicate was admitted in order.
   */
  endArticulation: IAutoMovieQuaternion | undefined;
}
