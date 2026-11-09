import type { IAutoMovieBicubicAtlasGeometry } from "@automovie/interface";

import type { IAutoMovieRecoveryChartSourcePiece } from "./IAutoMovieRecoveryChartSourcePiece";

/**
 * Successful local Coons chart compilation with exact boundary authority and provenance.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
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
