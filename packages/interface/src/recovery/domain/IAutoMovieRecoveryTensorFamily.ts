import type {
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryDomainAddress,
  IAutoMovieRecoveryTensorBoundary,
} from "../../index";

/**
 * Saved tensor recipe and the original closed groups whose generation it owns.
 * Endpoint bindings do not certify transverse continuity or source fidelity.
 */

export interface IAutoMovieRecoveryTensorFamily {
  /** Unique source-free family identity. */
  id: string;

  /** Complete analytic recipe with controls in model metres. */
  geometry: IAutoMovieBicubicAtlasGeometry;

  /** Exact saved interval and group occurrences delegated to this family. */
  replacedGroups: readonly IAutoMovieRecoveryDomainAddress[];

  /**
   * Named endpoint curves and their exact control-ID and phase-interval
   * bindings.
   */
  boundaries: readonly IAutoMovieRecoveryTensorBoundary[];
}
