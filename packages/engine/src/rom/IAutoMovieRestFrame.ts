import { IAutoMovieAxisFrame } from "./IAutoMovieAxisFrame";

/**
 * Optional degree-valued rest mappings for the three anatomical axes. An absent axis uses sign one and zero neutral in conversion.
 *
 * @evidence contracts/development/design.md#principled-representation Store optional flexion/abduction/twist affine frames; absent axes use sign one and zero neutral in conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three anatomical axes keep rest mapping separate from skeleton constraints and pose sampling.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absence is identity rather than an inferred side-specific mirror, while conversion owners refuse invalid runtime frames.
 * @evidence contracts/development/common.md#meaningful-documentation Members state optional meaning and degree convention rather than arbitrary orientation recovery.
 */
export interface IAutoMovieRestFrame {
  /** Rest-frame mapping for the flexion axis. */
  flexion?: IAutoMovieAxisFrame;

  /** Rest-frame mapping for the abduction axis. */
  abduction?: IAutoMovieAxisFrame;

  /** Rest-frame mapping for the twist axis. */
  twist?: IAutoMovieAxisFrame;
}
