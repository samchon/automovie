import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { IAutoMovieContourLoftCurves64 } from "./IAutoMovieContourLoftCurves64";

/** Source-curve split point and chord-qualified restrictions on both sides. */
export namespace IAutoMovieSplitContourLeaf64 {
  /**
   * The actual Bernstein split endpoint and qualified restrictions on both
   * sides of a strict interior source phase. Each side checks its own chord
   * with the original tolerance. The restrictions inherit phase limits and
   * ancestry. Already qualified explicit children can exceed the adaptive
   * recursion limit.
   */
  export type IResult = {
    /**
     * Fresh copy of the Bernstein split endpoint in the source millimetre
     * frame. Equal boundary coordinates in the child nets need not share this
     * tuple object.
     */
    point: AutoMovieVector3Tuple;

    /**
     * Increasing source-phase leaves covering the original start through the
     * requested interior phase, repartitioned to the supplied chord tolerance.
     */
    before: IAutoMovieContourLoftCurves64.Leaf[];

    /**
     * Increasing source-phase leaves covering the requested phase through the
     * original end, with inherited ancestry and independent child-chord
     * qualification.
     */
    after: IAutoMovieContourLoftCurves64.Leaf[];
  };
}
