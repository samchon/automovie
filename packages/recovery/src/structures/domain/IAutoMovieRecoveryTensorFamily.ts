import type { IAutoMovieBicubicAtlasGeometry } from "@automovie/interface";

import type { IAutoMovieRecoveryDomainAddress } from "./IAutoMovieRecoveryDomainAddress";
import type { IAutoMovieRecoveryTensorBoundary } from "./IAutoMovieRecoveryTensorBoundary";

/**
 * Saved tensor recipe and the original closed groups whose generation it owns. Endpoint bindings do not certify transverse continuity or source fidelity.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing saved coefficient, ownership and observation contract without transformation.
 * @evidence contracts/common.md#clear-and-simple-design This independent record exposes the actual reconstruction input shared by its producer and consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration admits no source mesh, inferred observations or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Members state identity, physical units, optional presence and qualification boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runtime admission and realization own computational reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the records and immutable recipe arrays.
 */
export interface IAutoMovieRecoveryTensorFamily {
  /** Unique source-free family identity. */
  id: string;

  /** Complete analytic recipe with controls in model metres. */
  geometry: IAutoMovieBicubicAtlasGeometry;

  /** Exact saved interval and group occurrences delegated to this family. */
  replacedGroups: readonly IAutoMovieRecoveryDomainAddress[];

  /** Named endpoint curves and their exact control-ID and phase-interval bindings. */
  boundaries: readonly IAutoMovieRecoveryTensorBoundary[];
}
