import type { tessellateAutoMovieBicubicAtlas64 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieRecoveryAtlasPrimitiveRange } from "./IAutoMovieRecoveryAtlasPrimitiveRange";
import type { IAutoMovieRecoveryAtlasRealization } from "./IAutoMovieRecoveryAtlasRealization";

/**
 * Retained atlas mesh and optional same-field construction data.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
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
