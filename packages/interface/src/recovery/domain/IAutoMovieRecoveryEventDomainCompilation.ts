import type { IAutoMovieBicubicAtlasGeometry, IAutoMovieRecoveryChartSourcePiece } from "../../index";

/**
 * Successful local Coons chart compilation with exact boundary authority and provenance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Discriminates a completed coefficient compilation; this is not a surface-fidelity claim. Independent coefficient atlas with positions in metres.
 * @evidence contracts/development/design.md#principled-representation Largest checked endpoint disagreement before exact equality admission, millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface compileAutoMovieRecoveryEventDomain, compileAutoMovieRecoveryNativeNamedChart share IAutoMovieRecoveryEventDomainCompilation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Discriminates a completed coefficient compilation; this is not a surface-fidelity claim.
 */

export interface IAutoMovieRecoveryEventDomainCompilation {
 
 /** Discriminates a completed coefficient compilation; this is not a surface-fidelity claim. */
  complete: true;

 
 /** Independent coefficient atlas with positions in metres. */
  recipe: IAutoMovieBicubicAtlasGeometry;

 
 /** Sorted actual local U partition knots. */
  u: number[];

 
 /** Sorted actual local V partition knots. */
  v: number[];

 
 /** Per-patch native boundary provenance. */
  sourcePieces: IAutoMovieRecoveryChartSourcePiece[];

 
 /** Largest checked endpoint disagreement before exact equality admission, millimetres. */
  maximumConstructedSharedEndpointDifferenceMm: number;
}
