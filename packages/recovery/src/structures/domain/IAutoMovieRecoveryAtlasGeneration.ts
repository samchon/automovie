import type { tessellateAutoMovieBicubicAtlas64 } from "@automovie/engine/geometry/curve";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieRecoveryAtlasPrimitiveRange } from "./IAutoMovieRecoveryAtlasPrimitiveRange";
import type { IAutoMovieRecoveryAtlasRealization } from "./IAutoMovieRecoveryAtlasRealization";

/**
 * Retained atlas mesh and optional same-field construction data.
 *
 * @evidence contracts/common.md#principled-implementation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/common.md#clear-and-simple-design This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns returned records and arrays; the type acquires no resources.
 */
export interface IAutoMovieRecoveryAtlasGeneration extends IAutoMovieRecoveryAtlasRealization {
  /** Generated model-space mesh in metres. */
  mesh: IAutoMovieMesh;

  /** Requested [u0,v0,u1,v1,u2,v2] values per retained triangle. */
  triangleParameters?: number[];

  /** Requested actual bound coefficient grids in millimetres. */
  patchCoefficients?: NonNullable<
    tessellateAutoMovieBicubicAtlas64.Summary["patchCoefficients"]
  >;

  /** Retained triangle intervals with generating chart bounds. */
  primitiveRanges: IAutoMovieRecoveryAtlasPrimitiveRange[];
}
