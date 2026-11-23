import type { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/**
 * Data and callback contracts shared by the ResolveProductionFrameRate
 * operations.
 */
export namespace IAutoMovieResolveProductionFrameRate {
  /**
   * The exact frame rate a record carries beside its `fps` display scalar, in
   * lowest terms.
   *
   * When `frameRate` is present it is the identity, reduced by
   * {@link canonicalProductionFrameRate}, and `fps` must equal its quotient
   * exactly as a double; when it is absent, `fps` must be a positive safe
   * integer and reads as `fps/1`. A fractional rate therefore always travels as
   * an explicit numerator and denominator, because a decimal such as `29.97`
   * does not identify `30000/1001`.
   */
  export type IProps = {
    /** Display frames per second; must equal the exact rate when one is given. */
    fps: number;

    /** Exact rate; omitted for an integer `fps`. */
    frameRate?: IAutoMovieProductionFrameRate;
  };
}
