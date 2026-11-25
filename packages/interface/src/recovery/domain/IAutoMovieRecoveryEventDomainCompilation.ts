import type {
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryChartSourcePiece,
} from "../../index";

/**
 * Successful local Coons chart compilation with exact boundary authority and
 * provenance.
 */

export interface IAutoMovieRecoveryEventDomainCompilation {
  /**
   * Discriminates a completed coefficient compilation; this is not a
   * surface-fidelity claim.
   */
  complete: true;

  /** Independent coefficient atlas with positions in metres. */
  recipe: IAutoMovieBicubicAtlasGeometry;

  /** Sorted actual local U partition knots. */
  u: number[];

  /** Sorted actual local V partition knots. */
  v: number[];

  /** Per-patch native boundary provenance. */
  sourcePieces: IAutoMovieRecoveryChartSourcePiece[];

  /**
   * Largest checked endpoint disagreement before exact equality admission,
   * millimetres.
   */
  maximumConstructedSharedEndpointDifferenceMm: number;
}
