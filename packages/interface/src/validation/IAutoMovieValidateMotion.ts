import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";

/**
 * Data and callback contracts shared by the ValidateMotion operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Admit motion identity/skeleton, positive duration, loop, ordered in-range times/easing, frame pose/expression and adjacent-axis speed. Member documentation states the supplied records, units and absence meanings used by validateMotion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The shared motion/rig contracts separate authored keys from admission; invalid times, poses, expressions and speeds are reported rather than clamped.
 * @evidence contracts/development/design.md#principled-representation motion uses clip seconds and joint degrees, and skeleton supplies current joint membership and effective range-of-motion overrides.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateMotion, used by validateMotion. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateMotion {
  /**
   * Admit motion identity/skeleton, positive duration, loop, ordered in-range times/easing, frame pose/expression and adjacent-axis speed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Admit motion identity/skeleton, positive duration, loop, ordered in-range times/easing, frame pose/expression and adjacent-axis speed. Member documentation states the supplied records, units and absence meanings used by validateMotion.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The shared motion/rig contracts separate authored keys from admission; invalid times, poses, expressions and speeds are reported rather than clamped.
   * @evidence contracts/development/design.md#principled-representation motion uses clip seconds and joint degrees, and skeleton supplies current joint membership and effective range-of-motion overrides.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateMotion.IProps, used by validateMotion. Its motion, skeleton members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Borrowed clip with second-valued timestamps and degree-valued joints. */
    motion: IAutoMovieMotion;

    /** Current target rig supplying joint membership and effective ROM overrides. */
    skeleton: IAutoMovieSkeleton;
  };
}
