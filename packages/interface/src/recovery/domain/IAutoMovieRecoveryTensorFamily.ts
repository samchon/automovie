import type {
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryDomainAddress,
  IAutoMovieRecoveryTensorBoundary,
} from "../../index";

/**
 * Saved tensor recipe and the original closed groups whose generation it owns. Endpoint bindings do not certify transverse continuity or source fidelity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Unique source-free family identity. Complete analytic recipe with controls in model metres.
 * @evidence contracts/development/design.md#principled-representation Saved tensor recipe and the original closed groups whose generation it owns. Endpoint bindings do not certify transverse continuity or source fidelity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryAnalyticRealizationInput, IAutoMovieRecoveryTensorFamiliesInput share IAutoMovieRecoveryTensorFamily's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
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
