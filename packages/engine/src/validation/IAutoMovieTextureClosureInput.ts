import { IAutoMovieAssetProvenance, IAutoMovieModel } from "@automovie/interface";
import { IAutoMovieSceneEnvironmentUse } from "./IAutoMovieSceneEnvironmentUse";
import { IAutoMovieTextureImageFacts } from "./IAutoMovieTextureImageFacts";

/**
 * Everything the texture closure is decided against.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `IAutoMovieTextureClosureInput` gathers every material and environment image use with the ledger and byte facts that authorize it.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `IAutoMovieTextureClosureInput` defines the complete resource-closure scope checked for missing, unused, or conflicting surface assets.
 */
export interface IAutoMovieTextureClosureInput {
  /**
   * Exact production id whose ledger entries authorize these uses.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `production` names the production whose provenance ledger is allowed to authorize the sampled images.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `production` supplies the ownership identity checked against each registered asset record.
   */
  production: string;
  /**
   * Compiled models whose materials bind PBR images.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `models` identifies the compiled material slots that actually sample each PBR image.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `models` provides model, material, and texture-member paths for locating unresolved surface resources.
   */
  models: readonly IAutoMovieModel[];
  /**
   * Compiled shots whose scenes bind image lighting.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `scenes` identifies the shot-owned environment declarations that sample image lighting.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `scenes` provides shot and environment paths for failures outside model material bindings.
   */
  scenes: readonly IAutoMovieSceneEnvironmentUse[];
  /**
   * The project asset ledger, exactly as the manifest holds it.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `assets` carries the manifest ledger entries against which every sampled image path is authorized.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `assets` supplies ownership, kind, and declared-use facts for missing-use and unused-resource decisions.
   */
  assets: readonly IAutoMovieAssetProvenance[];
  /**
   * Image facts for one registered asset path, or `undefined` when the builder
   * could not read the bytes as an image at all.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `facts` resolves one asset path to the media type and dimensions proved by its bytes.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `facts` leaves an unreadable image unresolved so the validator rejects it instead of inventing metadata.
   */
  facts: (asset: string) => IAutoMovieTextureImageFacts | undefined;
}
