import type { IAutoMovieModel, IAutoMovieRecoveryAtlasPrimitiveRange, IAutoMovieRecoveryAtlasRealization } from "../../index";

/**
 * Coefficient-recipe and independently generated model views of one atlas authority.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Model retaining the caller-supplied bicubic coefficient recipe. Model using newly generated triangles and normals.
 * @evidence contracts/development/design.md#principled-representation Coefficient-recipe and independently generated model views of one atlas authority.
 * @evidence contracts/development/design.md#minimal-and-owned-surface compileAutoMovieRecoveryAtlas share IAutoMovieRecoveryAtlasCompilation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Processing and approximation qualifications, independent of source fidelity.
 */

export interface IAutoMovieRecoveryAtlasCompilation {
 
 /** Model retaining the caller-supplied bicubic coefficient recipe. */
  recipeModel: IAutoMovieModel;

 
 /** Model using newly generated triangles and normals. */
  compiledModel: IAutoMovieModel;

 
 /** Processing and approximation qualifications, independent of source fidelity. */
  realization: IAutoMovieRecoveryAtlasRealization;

 
 /** Generated triangle ownership and local chart intervals. */
  primitiveRanges: IAutoMovieRecoveryAtlasPrimitiveRange[];
}
