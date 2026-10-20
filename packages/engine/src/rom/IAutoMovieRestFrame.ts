import { IAutoMovieAxisFrame } from "./IAutoMovieAxisFrame";

/**
 * Optional degree-valued rest mappings for the three anatomical axes. An absent axis uses sign one and zero neutral in conversion.
 *
 * @evidence contracts/common.md#principled-implementation Store optional flexion/abduction/twist affine frames; absent axes use sign one and zero neutral in conversion.
 * @evidence contracts/common.md#clear-and-simple-design Three anatomical axes keep rest mapping separate from skeleton constraints and pose sampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absence is identity rather than an inferred side-specific mirror, while conversion owners refuse invalid runtime frames.
 * @evidence contracts/common.md#meaningful-documentation Members state optional meaning and degree convention rather than arbitrary orientation recovery.
 * @evidence contracts/performance.md#efficient-algorithms At most three fixed axis records occupy constant storage; conversions own evaluation cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Unchanged rig frames can serve multiple angles, without encoding a result cache or invalidation guarantee.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns borrowed frame records and no joint history, native rig or task is retained.
 */
export interface IAutoMovieRestFrame {
  /** Rest-frame mapping for the flexion axis. */
  flexion?: IAutoMovieAxisFrame;

  /** Rest-frame mapping for the abduction axis. */
  abduction?: IAutoMovieAxisFrame;

  /** Rest-frame mapping for the twist axis. */
  twist?: IAutoMovieAxisFrame;
}
