import type { IAutoMovieBicubicAtlasGeometry } from "./IAutoMovieBicubicAtlasGeometry";
import { IAutoMovieMeshGeometry } from "./IAutoMovieMeshGeometry";
import { IAutoMoviePrimitiveGeometry } from "./IAutoMoviePrimitiveGeometry";

/**
 * One model part's primitive, shared bicubic atlas, or explicit triangle data.
 *
 * Discriminated on `type`: primitive recipes carry named dimensions, bicubic atlases carry complete shared polynomial coefficients, and meshes carry explicit triangle attributes. Each path renders to triangles through its owning engine operator. Provenance belongs to {@link AutoMovieAssetOrigin} at the model level.
 *
 * @evidence contracts/common.md#principled-implementation The discriminator separates bounded primitive recipes, shared bicubic coefficients and explicit triangles; engine and viewer consumers narrow the union before realization.
 * @evidence contracts/common.md#clear-and-simple-design Three closed arms retain their own recipe or buffer contracts, while model origin independently carries provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mesh representation does not imply import or permit transcribed content; deterministic production generators can supply explicit triangles through the same arm.
 * @evidence contracts/common.md#meaningful-documentation Explains both representations, their common triangle rendering path, and why provenance belongs to the model rather than the geometry discriminator.
 */
export type IAutoMovieGeometry =
  | IAutoMoviePrimitiveGeometry
  | IAutoMovieMeshGeometry
  | IAutoMovieBicubicAtlasGeometry;
