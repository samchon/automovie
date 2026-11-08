import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieRecoveryAtlasPrimitiveRange } from "./IAutoMovieRecoveryAtlasPrimitiveRange";
import type { IAutoMovieRecoveryAtlasRealization } from "./IAutoMovieRecoveryAtlasRealization";

/**
 * Coefficient-recipe and independently generated model views of one atlas authority.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
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
