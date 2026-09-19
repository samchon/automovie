import { IAutoMovieSceneEnvironment } from "@automovie/interface";

/**
 * One compiled shot's scene environment, addressed by the shot that owns it.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `IAutoMovieSceneEnvironmentUse` attaches one environment image declaration to the exact compiled shot that samples it.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `IAutoMovieSceneEnvironmentUse` provides the consumer scope needed to locate missing or multiply interpreted lighting resources.
 */
export interface IAutoMovieSceneEnvironmentUse {
  /**
   * Exact shot id.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `shot` names the compiled shot whose image-lighting use is being validated.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `shot` supplies the stable consumer identity included in an environment-resource failure path.
   */
  shot: string;
  /**
   * The scene's declared environment, or null/undefined when it declares none.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `environment` carries the optional lighting image and interpretation selected by the owning scene.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `environment` distinguishes an absent use from a declared image whose resource closure must resolve.
   */
  environment?: IAutoMovieSceneEnvironment | null;
}
