import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMoviePolarSector } from "./IAutoMoviePolarSector";
import type { IAutoMovieQuarters } from "./IAutoMovieQuarters";
import type { IAutoMovieViewConic } from "./IAutoMovieViewConic";

/** Data and callback contracts shared by the ViewSection operations. */
export namespace IAutoMovieViewSection {
  /**
   * Four positive finite support distances from the source axis. Supply chart
   * millimetres in +u, +v, −u, −v order.
   */
  export interface IBox {
    /** Four support half-extents in chart millimetres, ordered +u, +v, −u, −v. */
    extents: IAutoMovieQuarters<number>;
  }

  /**
   * Prepared four-quarter section with its actual conic source and
   * observations. Bare preparation leaves girth and diagonals at zero. Full
   * preparation reads the source's corner directions and measures girth
   * numerically.
   */
  export interface ISection {
    /**
     * Original four directional half-extents admitted as the source support
     * box.
     */
    box: IAutoMovieViewSection.IBox;

    /**
     * Dimensionless conic shoulder shares for the quarters starting at +u, +v,
     * −u and −v.
     */
    shoulders: IAutoMovieQuarters<number>;

    /**
     * Cardinal source guide readings in quarter order, with radial derivatives
     * shared at the corresponding guide.
     */
    guides: IAutoMovieQuarters<IAutoMoviePolarSector.IGuide>;

    /**
     * Increasing-angle observations of the native conic pieces for quadrature
     * and inspection.
     */
    knots: IAutoMoviePolarSector.IGuide[];

    /**
     * Prepared rational conic quarters and their guide corrections, including
     * the producer's explicit failure state.
     */
    conics: IAutoMovieViewConic.ICurve;

    /**
     * Four zero entries in this preparation. Quarter fullness is carried by
     * shoulders.
     */
    fullness: IAutoMovieQuarters<number>;

    /**
     * Numerical native perimeter in millimetres. Bare preparation leaves zero;
     * a failed measurement can be nonfinite.
     */
    girth: number;

    /**
     * Native radii in millimetres along the four box corner directions. Bare
     * preparation leaves zeros.
     */
    diagonals: IAutoMovieQuarters<number>;
  }

  /**
   * Admitted lower and upper common shoulder samples and their measured native
   * girths. Endpoints include the same authored quarter departures used by the
   * target solver.
   */
  export interface IRange {
    /**
     * Lower and upper dimensionless common shoulder shares before adding
     * quarter departures.
     */
    shoulder: [number, number];

    /** Corresponding lower and upper numerical native perimeters in millimetres. */
    girth: [number, number];
  }

  /**
   * Outcome of requesting a section by girth. An admitted match returns a
   * section and empty diagnostics. An out-of-reach request can return the
   * reached endpoint with a diagnostic. A report can also retain an estimate or
   * a null section when source or residual admission fails.
   */
  export interface ISolved {
    /**
     * Admitted native section, reached boundary or available estimate. Null
     * reports that no usable section was selected.
     */
    section: IAutoMovieViewSection.ISection | null;

    /**
     * Reach, source or measured-residual diagnostics. An accepted target has an
     * empty list.
     */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }
}
