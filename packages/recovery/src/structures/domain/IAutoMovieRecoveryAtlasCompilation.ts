import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieRecoveryAtlasPrimitiveRange } from "./IAutoMovieRecoveryAtlasPrimitiveRange";
import type { IAutoMovieRecoveryAtlasRealization } from "./IAutoMovieRecoveryAtlasRealization";

/**
 * Coefficient-recipe and independently generated model views of one atlas authority.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without changing its calculations.
 * @evidence contracts/common.md#clear-and-simple-design This shared contract gives the operation's callers and producer one explicit structural definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration supplies no inferred measurements, fallback geometry or runtime defaults.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, budget meaning and completion or optional-state semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache or completed operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records are caller-owned and acquire no resources.
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
