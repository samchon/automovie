import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMoviePolarSector } from "./IAutoMoviePolarSector";
import type { IAutoMovieQuarters } from "./IAutoMovieQuarters";
import type { IAutoMovieViewConic } from "./IAutoMovieViewConic";

/** Data and callback contracts shared by the ViewSection operations. */
export namespace IAutoMovieViewSection {
  /** The finite positive support half extents about the source axis. */
  export interface IBox {
    /** Half extents along +u,+v,-u,-v, millimetres, finite and positive. */
    extents: IAutoMovieQuarters<number>;
  }

  /** One source section before periodic phase fitting. */
  export interface ISection {
    /** Original source support box. */
    box: IAutoMovieViewSection.IBox;

    /** Original conic shoulder per quarter. */
    shoulders: IAutoMovieQuarters<number>;

    /**
     * Four exact cardinal guide jets, including shared radial second
     * derivatives.
     */
    guides: IAutoMovieQuarters<IAutoMoviePolarSector.IGuide>;

    /**
     * Quadrature/inspection observations of the actual source, in increasing
     * angle; these do not define an interpolant.
     */
    knots: IAutoMoviePolarSector.IGuide[];

    /**
     * The actual exact-conic/correction source, including an explicit admission
     * failure.
     */
    conics: IAutoMovieViewConic.ICurve;

    /** No extra polar bump; quarter fullness belongs to shoulders. */
    fullness: IAutoMovieQuarters<number>;

    /**
     * Numerical taut-tape girth in millimetres; zero in bare and nonfinite on
     * quadrature failure.
     */
    girth: number;

    /**
     * Radii along the four original corner directions, derived observations in
     * millimetres.
     */
    diagonals: IAutoMovieQuarters<number>;
  }

  /** Finite admitted common-shoulder reach and its actual source girths. */
  export interface IRange {
    /** Least and greatest admitted common shoulder before quarter departures. */
    shoulder: [number, number];

    /** Corresponding actual-source girths, millimetres. */
    girth: [number, number];
  }

  /** A section selected by requested girth and any explicit reach diagnostic. */
  export interface ISolved {
    /**
     * Actual source section, an admitted outside-request endpoint, or null
     * without finite admitted reach/estimate. A nonnull result can retain an
     * unresolved-residual diagnostic.
     */
    section: IAutoMovieViewSection.ISection | null;

    /**
     * Explicit reach/source/residual diagnostic; empty only after measured
     * residual admission.
     */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }
}
