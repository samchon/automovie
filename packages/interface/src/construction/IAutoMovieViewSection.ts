import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMoviePolarSector } from "./IAutoMoviePolarSector";
import type { IAutoMovieQuarters } from "./IAutoMovieQuarters";
import type { IAutoMovieViewConic } from "./IAutoMovieViewConic";





/** Data and callback contracts shared by the ViewSection operations. */
export namespace IAutoMovieViewSection {
  /**
     * The finite positive support half extents about the source axis.
     *
     * @evidence contracts/development/design.md#principled-representation Four positive extents identify the support lines at the cardinal chart angles.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One tuple carries the four support identities.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts No source extent is derived from a mesh or fitted for validity.
     * @evidence contracts/development/common.md#meaningful-documentation States chart directions and millimetres.
     */
    export interface IBox {
      /** Half extents along +u,+v,-u,-v, millimetres, finite and positive. */
      extents: IAutoMovieQuarters<number>;
    }

  /**
     * One source section before periodic phase fitting.
     *
     * @evidence contracts/development/design.md#principled-representation The box, original shoulders, shared main jets and admitted rational/corrected source describe the actual section function.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One record separates source ownership from quadrature observations and derived girth/diagonals.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Observation knots never replace the actual rational source and no failure is hidden.
     * @evidence contracts/development/common.md#meaningful-documentation Members name exact inputs, evaluator, observations and derived millimetre measures.
     */
    export interface ISection {
      /** Original source support box. */
      box: IAutoMovieViewSection.IBox;
  
      /** Original conic shoulder per quarter. */
      shoulders: IAutoMovieQuarters<number>;
  
      /** Four exact cardinal guide jets, including shared radial second derivatives. */
      guides: IAutoMovieQuarters<IAutoMoviePolarSector.IGuide>;
  
      /** Quadrature/inspection observations of the actual source, in increasing angle; these do not define an interpolant. */
      knots: IAutoMoviePolarSector.IGuide[];
  
      /** The actual exact-conic/correction source, including an explicit admission failure. */
      conics: IAutoMovieViewConic.ICurve;
  
      /** No extra polar bump; quarter fullness belongs to shoulders. */
      fullness: IAutoMovieQuarters<number>;
  
      /** Numerical taut-tape girth in millimetres; zero in bare and nonfinite on quadrature failure. */
      girth: number;
  
      /** Radii along the four original corner directions, derived observations in millimetres. */
      diagonals: IAutoMovieQuarters<number>;
    }

  /**
     * Finite admitted common-shoulder reach and its actual source girths.
     *
     * @evidence contracts/development/design.md#principled-representation Valid source sections and finite actual-source quadrature define the two returned reach endpoints.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One pair for shoulder and one for girth describe the range.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not claim mathematical reach beyond finite source/quadrature admission.
     * @evidence contracts/development/common.md#meaningful-documentation Members state shoulder shares and millimetre girths.
     */
    export interface IRange {
      /** Least and greatest admitted common shoulder before quarter departures. */
      shoulder: [number, number];
  
      /** Corresponding actual-source girths, millimetres. */
      girth: [number, number];
    }

  /**
     * A section selected by requested girth and any explicit reach diagnostic.
     *
     * @evidence contracts/development/design.md#principled-representation The actual source girth selects the common shoulder, while an outside request retains the admitted endpoint with a diagnostic.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One nullable section and diagnostic list represent success and named failure.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Never silently rescales a box or hides an outside-range request.
     * @evidence contracts/development/common.md#meaningful-documentation States null and retained-endpoint meanings.
     */
    export interface ISolved {
      /** Actual source section, an admitted outside-request endpoint, or null without finite admitted reach/estimate. A nonnull result can retain an unresolved-residual diagnostic. */
      section: IAutoMovieViewSection.ISection | null;
  
      /** Explicit reach/source/residual diagnostic; empty only after measured residual admission. */
      diagnostics: IAutoMovieLoftContract.IDiagnostic[];
    }
}
