import type {
  IAutoMovieModel,
  IAutoMovieRecoveryAtlasPrimitiveRange,
  IAutoMovieRecoveryAtlasRealization,
} from "..";

/**
 * Coefficient-recipe and independently generated model views of one atlas
 * authority.
 */

export interface IAutoMovieRecoveryAtlasCompilation {
  /** Model retaining the caller-supplied bicubic coefficient recipe. */
  recipeModel: IAutoMovieModel;

  /** Model using newly generated triangles and normals. */
  compiledModel: IAutoMovieModel;

  /**
   * Processing and approximation qualifications, independent of source
   * fidelity.
   */
  realization: IAutoMovieRecoveryAtlasRealization;

  /** Generated triangle ownership and local chart intervals. */
  primitiveRanges: IAutoMovieRecoveryAtlasPrimitiveRange[];
}
