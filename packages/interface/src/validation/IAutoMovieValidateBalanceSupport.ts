import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieBalanceSupportWindow } from "./IAutoMovieBalanceSupportWindow";

/**
 * Data and callback contracts shared by the ValidateBalanceSupport operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Sample FK within valid support windows, project a single-bone or weighted joint-position center onto XZ, and warn beyond the support hull plus margin. Member documentation states the supplied records, units and absence meanings used by validateBalanceSupport.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The projected joint centre is a declared support proxy, not a full dynamic balance proof; physicsIntent suppresses matching plausibility advice without changing the authored motion.
 * @evidence contracts/development/design.md#principled-representation motion and skeleton provide FK, supports define timed support hulls, and sampleRate is hertz; optional clinical remaps preserve the rig's authored axes and rest frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateBalanceSupport, used by validateBalanceSupport. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateBalanceSupport {
  /**
   * Sample FK within valid support windows, project a single-bone or weighted joint-position center onto XZ, and warn beyond the support hull plus margin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Sample FK within valid support windows, project a single-bone or weighted joint-position center onto XZ, and warn beyond the support hull plus margin. Member documentation states the supplied records, units and absence meanings used by validateBalanceSupport.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The projected joint centre is a declared support proxy, not a full dynamic balance proof; physicsIntent suppresses matching plausibility advice without changing the authored motion.
   * @evidence contracts/development/design.md#principled-representation motion and skeleton provide FK, supports define timed support hulls, and sampleRate is hertz; optional clinical remaps preserve the rig's authored axes and rest frames.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateBalanceSupport.IProps, used by validateBalanceSupport. Its motion, skeleton, supports, sampleRate, path, jointAxes, restFrames, physicsIntent members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Motion clip to sample. */
    motion: IAutoMovieMotion;

    /** Skeleton used for forward kinematics. */
    skeleton: IAutoMovieSkeleton;

    /** Declared support windows to test. */
    supports: readonly IAutoMovieBalanceSupportWindow[];

    /** Samples per second used by the validator. Defaults to `24`. */
    sampleRate?: number;

    /** JSON path of the support annotation being checked. Defaults to `$input`. */
    path?: string;

    /** Optional clinical-axis remap for rigs authored in semantic axes. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** Optional rest-frame remap for clinical authoring. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /**
     * Marker that opts the clip out of the balance expectation: a deliberately
     * off-balance pose (wire-fu, a mid-spin freeze, a tiptoe) sets this and the
     * matching warnings are suppressed.
     */
    physicsIntent?: string;
  };
}
