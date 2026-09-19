import { IAutoMovieAssetProvenance } from "./IAutoMovieAssetProvenance";

/**
 * Project asset byte identities and consumer bindings.
 *
 * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `IAutoMovieAssetManifest` as the portable data boundary for the asset external provenance digest requirement.
 * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `IAutoMovieAssetManifest` for the asset spec adoption output system contract.
 */
export interface IAutoMovieAssetManifest {
  /**
   * Asset-manifest format.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `version` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `version` for the asset spec adoption output system contract.
   */
  version: 1;

  /**
   * Every distributable project asset, ordered by canonical path.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `assets` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `assets` for the asset spec adoption output system contract.
   */
  assets: IAutoMovieAssetProvenance[];
}
