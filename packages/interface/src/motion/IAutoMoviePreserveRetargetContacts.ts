import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieViolationCollector } from "../validation/IAutoMovieViolationCollector";
import type { IAutoMovieMotion } from "./IAutoMovieMotion";
import type { IAutoMovieRetargetContactProps } from "./IAutoMovieRetargetContactProps";

/**
 * Data and callback contracts shared by the PreserveRetargetContacts operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Admitted source and target motions share key times, source contacts are mapped by dimensionless rootScale and residuals are measured in target metres. The retarget pass reports constrained residuals through the supplied collector; it cannot erase source sliding.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMoviePreserveRetargetContacts contracts used by packages/engine/src/motion/preserveRetargetContacts.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Admitted source and target motions share key times, source contacts are mapped by dimensionless rootScale and residuals are measured in target metres. The retarget pass reports constrained residuals through the supplied collector; it cannot erase source sliding. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMoviePreserveRetargetContacts contract belongs to interface; packages/engine/src/motion/preserveRetargetContacts.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMoviePreserveRetargetContacts {
  /**
   * Correct a root-scaled retarget clip at its existing authored key times using each source frame's foot/declared hand contact mapped by rootScale. Source slides persist; ROM-limited residuals above tolerance*rootScale are collector warnings, while dynamic nonfinite ground or callback exceptions throw. Inputs have passed retarget admission and parallel source/target key times agree.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Admitted source and target motions share key times, source contacts are mapped by dimensionless rootScale and residuals are measured in target metres. The retarget pass reports constrained residuals through the supplied collector; it cannot erase source sliding.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMoviePreserveRetargetContacts.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Admitted source and target motions share key times, source contacts are mapped by dimensionless rootScale and residuals are measured in target metres. The retarget pass reports constrained residuals through the supplied collector; it cannot erase source sliding. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMoviePreserveRetargetContacts.IProps contract belongs to interface; packages/engine/src/motion/preserveRetargetContacts.ts uses this boundary. Runtime computation remains with those consumers.
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
    collector: IAutoMovieViolationCollector;
  };
}
