import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieBalanceSupportWindow } from "./IAutoMovieBalanceSupportWindow";

/** Data and callback contracts shared by the ValidateBalanceSupport operations. */
export namespace IAutoMovieValidateBalanceSupport {
  /**
   * Sample FK within valid support windows, project a single-bone or weighted
   * joint-position center onto XZ, and warn beyond the support hull plus
   * margin.
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
