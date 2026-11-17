/**
 * Data and callback contracts shared by the MinimumJerk operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The profile stores dimensionless progress and its first two derivatives with respect to normalized time. minimumJerk admits finite time, holds progress at 0 or 1 outside the unit interval and returns zero derivatives there; conversion to seconds requires duration and its square.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieMinimumJerk contracts used by packages/engine/src/motion/minimumJerk.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation The profile stores dimensionless progress and its first two derivatives with respect to normalized time. minimumJerk admits finite time, holds progress at 0 or 1 outside the unit interval and returns zero derivatives there; conversion to seconds requires duration and its square. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieMinimumJerk contract belongs to interface; packages/engine/src/motion/minimumJerk.ts and packages/engine/src/motion/superposeMinimumJerk.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieMinimumJerk {
  /**
   * The profile at one instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The profile stores dimensionless progress and its first two derivatives with respect to normalized time. minimumJerk admits finite time, holds progress at 0 or 1 outside the unit interval and returns zero derivatives there; conversion to seconds requires duration and its square.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieMinimumJerk.IProfile keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation The profile stores dimensionless progress and its first two derivatives with respect to normalized time. minimumJerk admits finite time, holds progress at 0 or 1 outside the unit interval and returns zero derivatives there; conversion to seconds requires duration and its square. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieMinimumJerk.IProfile contract belongs to interface; packages/engine/src/motion/minimumJerk.ts and packages/engine/src/motion/superposeMinimumJerk.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IProfile {
    /** Share of the movement done, in [0, 1]. */
    s: number;

    /** Rate of the share per unit normalized time. */
    ds: number;

    /** Acceleration of the share per unit normalized time squared. */
    dds: number;
  }
}
