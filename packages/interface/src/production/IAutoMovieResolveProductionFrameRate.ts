import type { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/**
 * Data and callback contracts shared by the ResolveProductionFrameRate operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The exact frame rate a record carries beside its `fps` display scalar, in lowest terms. Member documentation states the supplied records, units and absence meanings used by resolveProductionFrameRate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Safe integer and positivity checks belong to the rate resolver; numeric fields alone do not establish a valid or exactly representable timebase.
 * @evidence contracts/development/design.md#principled-representation The frame-rate input preserves the existing scalar/rational representation and resolves it to the production's canonical positive rational clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieResolveProductionFrameRate, used by resolveProductionFrameRate. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieResolveProductionFrameRate {
  /**
   * The exact frame rate a record carries beside its `fps` display scalar, in lowest terms.
   *
   * When `frameRate` is present it is the identity, reduced by {@link canonicalProductionFrameRate}, and `fps` must equal its quotient exactly as a double; when it is absent, `fps` must be a positive safe integer and reads as `fps/1`. A fractional rate therefore always travels as an explicit numerator and denominator, because a decimal such as `29.97` does not identify `30000/1001`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The exact frame rate a record carries beside its `fps` display scalar, in lowest terms. Member documentation states the supplied records, units and absence meanings used by resolveProductionFrameRate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Safe integer and positivity checks belong to the rate resolver; numeric fields alone do not establish a valid or exactly representable timebase.
   * @evidence contracts/development/design.md#principled-representation The frame-rate input preserves the existing scalar/rational representation and resolves it to the production's canonical positive rational clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieResolveProductionFrameRate.IProps, used by resolveProductionFrameRate. Its fps, frameRate members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Display frames per second; must equal the exact rate when one is given. */
    fps: number;

    /** Exact rate; omitted for an integer `fps`. */
    frameRate?: IAutoMovieProductionFrameRate;
  };
}
