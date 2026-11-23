import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMovieContourLoftCurves64 } from "./IAutoMovieContourLoftCurves64";

/** Source-curve split point and chord-qualified restrictions on both sides. */
export namespace IAutoMovieSplitContourLeaf64 {
  /**
   * Split endpoint and repartitioned children of a retained source restriction
   * at its declared interior phase, under one finite-segment chord bound. A
   * parent's bound need not hold against a child's different chord, even for a
   * straight geometric trace. The shared point is the Bernstein split endpoint,
   * never its proxy chord point. Ancestry depth and phase limits are inherited
   * without resetting subdivision. Already qualified explicit children need no
   * additional adaptive work, even if their exact restriction increases
   * ancestry beyond the adaptive depth limit.
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
