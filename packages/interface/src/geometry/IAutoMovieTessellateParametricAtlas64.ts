import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { IAutoMovieCanonicalBoundaryPhase64 } from "./IAutoMovieCanonicalBoundaryPhase64";

/**
 * Data and callback contracts shared by the TessellateParametricAtlas64
 * operations.
 */
export namespace IAutoMovieTessellateParametricAtlas64 {
  /**
   * Sample finite parametric charts with declared boundary incidence. Fields
   * and first partials use millimetres; output positions use metres. The four
   * sides are bottom/right/top/left, each in its increasing local coordinate.
   * Exact canonical phase requests are unioned across every incident
   * restriction before emission. Extra exterior samples enter the containing
   * cell's parameter polygon. Boundary owners supply positions; all conflicting
   * incident charts are omitted before emission, while distinct chart normal
   * fans remain separate. Callbacks and their input coefficients must remain
   * immutable for the call's lifetime. This fixed lattice has no
   * field-to-triangle error or G1/immersion certificate. A nonlinear
   * restriction declares both parameterize and localize. Their values are
   * checked on the finite schedule, not certified over the continuous domain.
   * Original local addresses are retained for a restriction's own requests, so
   * an approximate numerical inverse cannot replace an exact authored lattice
   * point. A zero chart cross product may carry an authored analytic
   * normalLimit. Its use is counted separately and does not remove the singular
   * parameter sample or certify that the caller derived a unique continuous
   * surface normal.
   */
  export type IProps = {
    /**
     * Nonempty physical-vertex identity domain shared by the supplied charts
     * and their declared boundary owners.
     */
    domain: string;
    /**
     * Positive safe-integer bound on generated render vertices; exhaustion is a
     * resource failure, not permission to coarsen the authored lattice.
     */
    maxVertices: number;
    /**
     * Borrowed finite chart definitions; callbacks and their coefficients must
     * remain unchanged until this synchronous call returns.
     */
    patches: readonly {
      /**
       * Nonblank chart identity, unique within patches and retained in omission
       * diagnostics.
       */
      id: string;
      /** Integer u-lattice interval count from 1 through 128, inclusive. */
      stepsU: number;
      /** Integer v-lattice interval count from 1 through 128, inclusive. */
      stepsV: number;
      /**
       * Read the same immutable chart at unit coordinates u and v; return
       * finite millimetre position and first partials. Callback failures omit
       * the affected chart and produce diagnostics.
       */
      evaluate: (
        u: number,
        v: number,
      ) => {
        /**
         * Cartesian chart point in millimetres; boundary publication uses the
         * declared boundary owner's agreeing position.
         */
        point: AutoMovieVector3Tuple;
        /**
         * First chart partial per unit u, in millimetres, used with dv to
         * derive the analytic normal.
         */
        du: AutoMovieVector3Tuple;
        /**
         * First chart partial per unit v, in millimetres, with orientation
         * fixed by du cross dv.
         */
        dv: AutoMovieVector3Tuple;
        /**
         * Optional authored analytic limiting direction at a zero chart cross
         * product; finite nonzero directions are normalized, counted separately
         * and do not certify a unique continuous limit.
         */
        normalLimit?: AutoMovieVector3Tuple;
      };
      /**
       * Exactly four declared boundaries in bottom, right, top, left order;
       * each uses its increasing local chart coordinate.
       */
      edges: readonly {
        /**
         * Nonblank boundary authority identity used to union exact phase
         * requests across all incident restrictions.
         */
        authority: string;
        /**
         * Finite canonical phase at local zero, in [0,1]; differs from end and
         * may exceed it for reversed incidence.
         */
        start: number;
        /**
         * Finite canonical phase at local one, in [0,1]; direction follows end
         * minus start.
         */
        end: number;
        /**
         * Local unit coordinate to this authority's canonical phase; paired
         * with localize.
         */
        parameterize?: (local: number) => IAutoMovieCanonicalBoundaryPhase64;
        /**
         * Inverse on the directed restriction; finite schedule checks are not a
         * continuous certificate.
         */
        localize?: (phase: IAutoMovieCanonicalBoundaryPhase64) => number;
        /**
         * Read an immutable canonical boundary position at an exact phase.
         * Equal returned keys must have exactly equal coordinates across
         * incidents; a conflict omits every implicated chart.
         */
        sample: (phase: IAutoMovieCanonicalBoundaryPhase64) => {
          /**
           * Nonblank physical sample identity supplied by the boundary owner,
           * independent of rounded-coordinate coincidence.
           */
          key: string;
          /**
           * Finite canonical Cartesian boundary position in millimetres, copied
           * into the call's identity registry.
           */
          point: AutoMovieVector3Tuple;
        };
      }[];
    }[];
  };

  /**
   * Sample finite parametric charts with declared boundary incidence. Fields
   * and first partials use millimetres; output positions use metres. The four
   * sides are bottom/right/top/left, each in its increasing local coordinate.
   * Exact canonical phase requests are unioned across every incident
   * restriction before emission. Extra exterior samples enter the containing
   * cell's parameter polygon. Boundary owners supply positions; all conflicting
   * incident charts are omitted before emission, while distinct chart normal
   * fans remain separate. Callbacks and their input coefficients must remain
   * immutable for the call's lifetime. This fixed lattice has no
   * field-to-triangle error or G1/immersion certificate. A nonlinear
   * restriction declares both parameterize and localize. Their values are
   * checked on the finite schedule, not certified over the continuous domain.
   * Original local addresses are retained for a restriction's own requests, so
   * an approximate numerical inverse cannot replace an exact authored lattice
   * point. A zero chart cross product may carry an authored analytic
   * normalLimit. Its use is counted separately and does not remove the singular
   * parameter sample or certify that the caller derived a unique continuous
   * surface normal.
   */
  export type IResult = {
    /**
     * New indexed metre mesh; shared physical positions can have separate
     * render vertices for different chart normal fans.
     */
    mesh: IAutoMovieMesh;
    /**
     * Ordered omission, resource and normal qualifications, always including
     * the unproved field-approximation and continuity limitations.
     */
    diagnostics: string[];
    /**
     * Ids of successfully emitted charts in input order, excluding charts
     * rejected by canonical-boundary conflicts.
     */
    retainedPatches: string[];
    /**
     * Actual emitted and omitted work counts; none is a proof of approximation
     * accuracy or surface embedding.
     */
    counts: IResultCounts;
  };

  /** The counts object of {@link IResult}. */
  export type IResultCounts = {
    /**
     * Number of charts retained after boundary planning and emission
     * admission.
     */
    patches: number;
    /** Number of charts omitted after local planning or emission failure. */
    omittedPatches: number;
    /**
     * Actual generated render vertex count, including separate normal-fan
     * vertices at shared physical points.
     */
    vertices: number;
    /** Number of retained finite positive-area triangles. */
    triangles: number;
    /**
     * Samples whose chart partial cross product could not supply a finite
     * nonzero normal.
     */
    singularNormals: number;
    /**
     * Singular samples where an authored finite nonzero normalLimit supplied
     * the published unit direction.
     */
    limitingNormals: number;
    /** Proposed faces omitted for a zero or nonfinite cross-product magnitude. */
    zeroAreaTriangles: number;
  };
}
