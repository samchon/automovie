import type { IAutoMovieBicubicAtlasGeometry } from "@automovie/interface";

import type { IAutoMovieRecoveryChartSourcePiece } from "./IAutoMovieRecoveryChartSourcePiece";

/**
 * Successful local Coons chart compilation with exact boundary authority and provenance.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/common.md#clear-and-simple-design This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache or completed operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records are caller-owned and acquire no resources.
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
