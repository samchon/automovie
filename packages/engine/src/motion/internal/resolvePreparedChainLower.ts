import type {
  IAutoMovieChainBone,
  IAutoMovieJointPose,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieSolvePreparedChainPlantProps,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jointToQuaternion } from "../../kinematics/internal/jointToQuaternion";
import { jointToQuaternionOnBasis } from "../../kinematics/internal/jointToQuaternionOnBasis";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import type { prepareChainFit } from "./prepareChainFit";

/*
 * Resolve only a prepared chain's mid frame after its two supplied
 * articulations. Parent and intermediate bones must remain as they were during
 * preparation. An optional matching rig shares the basis admission; both
 * current joint articulations are still converted in their original order on
 * every read.
 */
export function resolvePreparedChainLower(props: IProps): IAutoMovieChainBone {
  return resolvePreparedChainLower.fromRotations(
    props.prepared,
    rotation(props, props.upper, props.prepared.chain.upper),
    rotation(props, props.lower, props.prepared.chain.lower),
  );
}

/*
 * The shared two-joint FK prefix for records or already admitted articulations.
 */
export namespace resolvePreparedChainLower {
  /*
   * Compose a mid frame from two already converted chain articulations. The
   * caller must use the preparation's clinical mapping and keep root, ancestors
   * and intermediate joints unchanged. Missing articulations are identity, as
   * in full FK; no unused clinical basis is admitted here.
   *
   * States admitted-quaternion input, stable prepared dependencies and
   * missing-articulation meaning. Composes prepared root frame, upper
   * articulation, fixed root-to-mid transform and lower articulation in the
   * original two-stage FK order. This prefix owns the rigid compositions for
   * both clinical candidates and an authored-order admission scan, so
   * validation order can change without duplicating FK mathematics. Accepts
   * actual admitted articulations rather than an ideal target; identity applies
   * only to an absent articulation, not an arbitrary clinical zero. Constant
   * quaternion/vector work with no clinical reconversion or skeleton walk; the
   * caller reuses the quaternion work its admission scan already completed.
   * Prepared fixed transforms and the exact completed articulation conversions
   * are reused; changed parent or intermediate inputs require new preparation.
   * Returns one fresh frame, retaining no inputs, cache, handles or tasks after
   * return.
   */
  export function fromRotations(
    prepared: IAutoMoviePreparedChainPlant,
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ): IAutoMovieChainBone {
    const upperRotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      prepared.upper.worldRotation,
      upper,
    );
    const lowerPosition: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      prepared.upper.worldPosition,
      AutoMovieEngineQuaternion.rotateVector(upperRotation, prepared.lowerOffset),
    );
    const lowerRotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.multiply(upperRotation, prepared.lowerRotation),
      lower,
    );
    return { worldPosition: lowerPosition, worldRotation: lowerRotation };
  }
}

/*
 * Reuse admitted bases at the same clinical-record sites without a new closure
 * per frame read.
 */
function rotation(
  props: IProps,
  joint: IAutoMovieJointPose,
  bone: IAutoMovieJointPose["bone"],
): IAutoMovieQuaternion {
  return props.rig === undefined
    ? jointToQuaternion(
        joint,
        props.jointAxes?.[bone],
        props.restFrames?.[bone],
      )
    : jointToQuaternionOnBasis.run(
        joint,
        props.rig.jointBasis(bone, "jointToQuaternion axes"),
        props.restFrames?.[bone],
      );
}

/*
 * Two supplied articulations under one unchanged prepared parent frame.
 */
interface IProps extends Pick<
  IAutoMovieSolvePreparedChainPlantProps,
  "prepared" | "jointAxes" | "restFrames"
> {
  /*
   * Root clinical articulation, with null axes at their declared rest.
   */
  upper: IAutoMovieJointPose;

  /*
   * Mid clinical articulation in the same axes and rest-frame convention.
   */
  lower: IAutoMovieJointPose;

  /*
   * Optional lazy basis owner of this exact unchanged rig and mappings.
   */
  rig?: prepareChainFit.IRig;
}
