import type { IAutoMovieSubdivisionCage } from "./IAutoMovieSubdivisionCage";
import type { IAutoMovieSubdivisionLevel } from "./IAutoMovieSubdivisionLevel";

/**
 * A two-refinement subdivision fitting domain with independent control and
 * limit constraints.
 *
 * All positions are local metre triples; anchors constrain original controls
 * while limit targets constrain the refined surface. Supply finite controls and
 * targets in a manifold quad domain. The fitter refuses targets on interior
 * creases and incomplete solves. The caller checks support adequacy and the
 * fitted surface against the required measurements.
 */
export namespace IAutoMovieFitSubdivisionDomain {
  /**
   * Coarse control anchors and limit targets for an explicitly refined fitting
   * domain.
   *
   * Two uniform Catmull-Clark steps introduce fitting freedom, as in the
   * refinement principle of Halstead, Kass and DeRose (1993), section 5. The
   * objective is instead the frozen discrete cotangent bending norm documented
   * by subdivisionBendingRows, not that paper's analytic plate integral.
   * https://www.eecs.umich.edu/courses/eecs598-1/halstead.pdf
   *
   * Coordinates are hierarchical: Q = R P + D, with D zero at retained original
   * indices. Source control anchors constrain P. Independent source limit
   * targets constrain the limit of Q; an index may carry both equations. Fine
   * controls wholly supported by anchored P have zero detail. Outside
   * regionFaces the refined original control surface is fixed, preserving the
   * consumer's neighbouring surface rather than an isolated patch's boundary
   * rule.
   *
   * The input is a manifold quad crop with a caller-owned support collar.
   * Active limit targets incident to an interior sharp edge are refused because
   * their limit masks are not smooth/boundary masks. Other support creases
   * retain their actual affine refinement and sharpness. The caller must
   * validate support against the whole joined consumer and preserve physical
   * measurements not implied by point equations. No embedding, no-fold,
   * clinical measurement, or pose guarantee is made.
   *
   * The synchronous solve borrows inputs. Supply one anchor and one optional
   * limit target per source vertex. Region faces use safe source ordinals.
   * Fixed surrounding controls preserve the consumer's support. Nonfinite
   * controls, targets, solved geometry or residuals cause refusal.
   */
  export type IProps = {
    /**
     * Initial pre-inverse samples with original control pins applied, metres;
     * indexed UV topology is preserved.
     */
    cage: IAutoMovieSubdivisionCage;

    /** Finite existing controls in packed metre XYZ, aligned to cage.positions. */
    controlPositions: readonly number[];

    /** Exact original coarse-control constraints; one flag per source vertex. */
    anchors: readonly boolean[];

    /**
     * Limit targets in metres; null omits a limit equation, independently of
     * anchors.
     */
    limitTargets: ReadonlyArray<readonly [number, number, number] | null>;

    /** Original integer face indices allowed to change, with exterior anchors. */
    regionFaces: ReadonlySet<number>;
  };

  /**
   * A completed two-step generating domain and its solved coarse controls.
   * Output arrays are newly owned; solver telemetry describes equality and
   * lifting-row residuals, not physical measurement, embedding or pose
   * quality.
   */
  export type IResult = {
    /**
     * New two-step refined generating domain in cage-local metres;
     * evaluateSubdivisionLevel can evaluate it without another render
     * refinement.
     */
    level: IAutoMovieSubdivisionLevel;

    /**
     * Copied solved original coarse controls as packed xyz metres in source
     * vertex order, before refinement and fine-detail addition.
     */
    coarseControls: number[];

    /**
     * Maximum solver row violation over all three coordinate solves, in
     * metre-valued row units; includes normalized bending-residual lifting
     * equations as well as authored equalities, not a surface-distance
     * certificate.
     */
    maximumEqualityError: number;

    /**
     * Three solver iteration counts in X, Y, Z order; each corresponds to a
     * completed coordinate solve.
     */
    iterations: number[];
  };
}
