import type { IAutoMovieBicubicAtlasGeometry } from "./IAutoMovieBicubicAtlasGeometry";
import type { IAutoMovieMeshGeometry } from "./IAutoMovieMeshGeometry";
import type { IAutoMoviePrimitiveGeometry } from "./IAutoMoviePrimitiveGeometry";

/**
 * One model part's primitive, shared bicubic atlas, or explicit triangle data.
 *
 * Discriminated on `type`: primitive recipes carry named dimensions, bicubic
 * atlases carry complete shared polynomial coefficients, and meshes carry
 * explicit triangle attributes. Each path renders to triangles through its
 * owning engine operator. Provenance belongs to {@link AutoMovieAssetOrigin} at
 * the model level.
 */
export type IAutoMovieGeometry =
  | IAutoMoviePrimitiveGeometry
  | IAutoMovieMeshGeometry
  | IAutoMovieBicubicAtlasGeometry;
