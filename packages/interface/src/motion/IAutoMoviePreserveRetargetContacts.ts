import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieViolationWarningSink } from "../validation/IAutoMovieViolationWarningSink";
import type { IAutoMovieMotion } from "./IAutoMovieMotion";
import type { IAutoMovieRetargetContactProps } from "./IAutoMovieRetargetContactProps";

/**
 * Data and callback contracts shared by the PreserveRetargetContacts
 * operations.
 */
export namespace IAutoMoviePreserveRetargetContacts {
  /**
   * Correct a root-scaled retarget clip at its existing authored key times
   * using each source frame's foot/declared hand contact mapped by rootScale.
   * Source slides persist; ROM-limited residuals above tolerance*rootScale are
   * collector warnings, while dynamic nonfinite ground or callback exceptions
   * throw. Inputs have passed retarget admission and parallel source/target key
   * times agree.
   */
  export type IProps = {
    /** Rig the clip was authored on. */
    source: IAutoMovieSkeleton;

    /** Rig the clip now plays on. */
    target: IAutoMovieSkeleton;

    /** The authored clip, read for source-space contact detection. */
    sourceMotion: IAutoMovieMotion;

    /** The root-scaled clip this pass corrects. */
    retargeted: IAutoMovieMotion;

    /** Root translation multiplier the contacts are mapped through. */
    rootScale: number;

    /** Lowest world Y of the source rest pose; the default ground plane. */
    sourceFloor: number;

    /** Source clinical axes. */
    sourceJointAxes: Partial<
      Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
    >;

    /** Source clinical rest frames. */
    sourceRestFrames: Partial<
      Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
    >;

    /** Target clinical axes. */
    targetJointAxes: Partial<
      Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
    >;

    /** Target clinical rest frames. */
    targetRestFrames: Partial<
      Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
    >;

    /** Caller policy; omitted means humanoid legs and no hand contact. */
    contacts: IAutoMovieRetargetContactProps | undefined;

    /** Sink the residual-slide warnings are reported on. */
    collector: IAutoMovieViolationWarningSink;
  };
}
