import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { IAutoMovieSkeletonTopology } from "../pose/IAutoMovieSkeletonTopology";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieFootLeg } from "./IAutoMovieFootLeg";
import type { IAutoMovieMotionSample } from "./IAutoMovieMotionSample";

/**
 * Data and callback contracts shared by the RekeyPlantedFeet operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Times, sampled poses and fixed model-metre targets are parallel and use one unchanged skeleton topology and clinical mapping. Only declared targeted legs are refitted; roots, expressions and unrelated joints remain the sampled values. Caller admission establishes parallel lengths.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieRekeyPlantedFeet contracts used by packages/engine/src/motion/rekeyPlantedFeet.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Times, sampled poses and fixed model-metre targets are parallel and use one unchanged skeleton topology and clinical mapping. Only declared targeted legs are refitted; roots, expressions and unrelated joints remain the sampled values. Caller admission establishes parallel lengths. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieRekeyPlantedFeet contract belongs to interface; packages/engine/src/motion/rekeyPlantedFeet.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieRekeyPlantedFeet {
  /**
   * Emit one corrected keyframe per admitted parallel time/pose/target sample using the same unchanged skeleton topology as stance detection. Only targeted leg chains are fitted; roots, expressions and other joints persist, while the prior corrected pose ranks equally accurate bend choices.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Times, sampled poses and fixed model-metre targets are parallel and use one unchanged skeleton topology and clinical mapping. Only declared targeted legs are refitted; roots, expressions and unrelated joints remain the sampled values. Caller admission establishes parallel lengths.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieRekeyPlantedFeet.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Times, sampled poses and fixed model-metre targets are parallel and use one unchanged skeleton topology and clinical mapping. Only declared targeted legs are refitted; roots, expressions and unrelated joints remain the sampled values. Caller admission establishes parallel lengths. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieRekeyPlantedFeet.IProps contract belongs to interface; packages/engine/src/motion/rekeyPlantedFeet.ts uses this boundary. Runtime computation remains with those consumers.
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
