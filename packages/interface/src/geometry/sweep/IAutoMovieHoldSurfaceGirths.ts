import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import type { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/** Network geometry and live rig access needed to solve declared rest girths. */
export namespace IAutoMovieHoldSurfaceGirths {
  /**
   * Hold the limit perimeter of a surface network's girth rings, the rings that
   * declare `perimeter`, by solving a radial factor along each sweep.
   *
   * A girth ring runs once round one sweep at one `u`. Along a row of
   * valence-four vertices whose loop neighbours lie opposite, beside rows of
   * such vertices, the Catmull-Clark limit is the tensor-product cubic
   * B-spline, so the limit along the row is the periodic uniform cubic B-spline
   * whose control points are `(A + 4 P + B) / 6` for each vertex `P` and its
   * two neighbours `A` and `B` across the row; its perimeter is integrated by
   * five-point Gauss-Legendre quadrature on every span. Each sweep's factor is
   * the sampled-overshoot-policy spline of `interpolateAutoMovieSpline` through
   * 1 at the sweep's other rings at one `u`, which meet neighbouring parts and
   * stay, and through a value at each girth ring, holding its end values beyond
   * the outermost knots; `IAutoMovieSweepRig.girth` folds it into the scale.
   * The girth values solve the system "every measured perimeter equals its
   * declaration" jointly by Broyden's method (Broyden 1965, Mathematics of
   * Computation 19(92):577-593), one rest fit per step: the Jacobian starts
   * diagonal, each perimeter in proportion to its own factor, which is exact
   * where the fit interpolates the row and no neighbouring sample reads another
   * factor, and each step's rank-one update learns how neighbouring rings
   * couple through the spline, cell averages or a least-squares fit, so rings
   * close together converge together where updating each alone would oscillate
   * or crawl; a step that would make a factor non-positive is halved. It stops
   * when every perimeter has relative error at most 1e-9 and refuses after 24
   * fits. Non-finite measurements/steps and zero representable progress are
   * refused before a factor update can enter nonterminating positivity
   * backtracking. The initial diagonal uses each measured perimeter directly,
   * without reconstructing it from a potentially cancellation-dominated
   * residual.
   */
  export type IProps = {
    /**
     * Read-only rest declaration selecting rings with explicit perimeter
     * targets. Each girth ring must run once around one sweep station; the
     * solver rejects unsupported cage/ring incidence.
     */
    network: IAutoMovieSurfaceNetwork;
    /**
     * Ring names to cage vertex indices in closed-loop order, produced by the
     * sampler. Each index addresses positions at three times its value.
     */
    rings: Record<string, number[]>;
    /**
     * Cage quad vertex-index lists, borrowed to establish regular row
     * neighbours for limit-perimeter integration.
     */
    faces: ReadonlyArray<readonly number[]>;
    /**
     * Number of cage vertices. The caller supplies indices within this
     * population and position buffers containing three scalars per vertex.
     */
    vertices: number;
    /**
     * Return the sealed compiled rig for an existing network sweep name. The
     * solve installs radial girth factors on these same rigs; do not return
     * unrelated new rigs on successive calls.
     */
    sweepRig: (name: string) => IAutoMovieSweepRig;
    /**
     * Re-evaluate and fit the complete network at rest using current girth
     * factors, overwriting the supplied packed metre control positions. Called
     * once per solve step; exceptions propagate.
     */
    rest: (positions: Float64Array) => void;
    /**
     * Writable packed rest control XYZ buffer in metres, with 3*vertices
     * entries. Overwritten by rest evaluations and read by the limit-perimeter
     * measurement; caller retains ownership. A failed solve can leave the rigs
     * and this buffer at its last evaluated trial; there is no whole-solve
     * rollback.
     */
    positions: Float64Array;
  };
}
