import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { IAutoMovieSkeletonTopology } from "../pose/IAutoMovieSkeletonTopology";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieFootLeg } from "./IAutoMovieFootLeg";
import type { IAutoMovieMotionSample } from "./IAutoMovieMotionSample";

/** Data and callback contracts shared by the RekeyPlantedFeet operations. */
export namespace IAutoMovieRekeyPlantedFeet {
  /**
   * Emit one corrected keyframe per admitted parallel time/pose/target sample
   * using the same unchanged skeleton topology as stance detection. Only
   * targeted leg chains are fitted; roots, expressions and other joints
   * persist, while the prior corrected pose ranks equally accurate bend
   * choices.
   */
  export type IProps = {
    /** Rig whose unchanged topology and ROM constrain correction. */
    skeleton: IAutoMovieSkeleton;

    /** Index of the same unchanged rig already used by stance detection. */
    topology: IAutoMovieSkeletonTopology;

    /** Sample times in local seconds, parallel to poses and targets. */
    times: readonly number[];

    /** Already sampled pose/expression values at the parallel times. */
    poses: ReadonlyArray<IAutoMovieMotionSample>;

    /** Declared leg chains eligible for pinned correction. */
    legs: readonly IAutoMovieFootLeg[];

    /** Per-frame fixed model-metre contacts keyed by foot bone. */
    targets: ReadonlyArray<
      ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>
    >;

    /** Optional clinical axes used to lower and replay solved joints. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** Optional clinical rest frames used to lower and replay solved joints. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  };
}
