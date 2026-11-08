import type { IAutoMovieBicubicAtlasGeometry } from "./IAutoMovieBicubicAtlasGeometry";
import { IAutoMovieMeshGeometry } from "./IAutoMovieMeshGeometry";
import { IAutoMoviePrimitiveGeometry } from "./IAutoMoviePrimitiveGeometry";

/**
 * One model part's primitive, shared bicubic atlas, or explicit triangle data.
 *
 * Discriminated on `type`: primitive recipes carry named dimensions, bicubic atlases carry complete shared polynomial coefficients, and meshes carry explicit triangle attributes. Each path renders to triangles through its owning engine operator. Provenance belongs to {@link AutoMovieAssetOrigin} at the model level.
 *
 * @evidence contracts/development/design.md#principled-representation The discriminator separates bounded primitive recipes, shared bicubic coefficients and explicit triangles; engine and viewer consumers narrow the union before realization.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three closed arms retain their own recipe or buffer contracts, while model origin independently carries provenance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Mesh representation does not imply import or permit transcribed content; deterministic production generators can supply explicit triangles through the same arm.
 * @evidence contracts/development/common.md#meaningful-documentation Explains both representations, their common triangle rendering path, and why provenance belongs to the model rather than the geometry discriminator.
 */
export type IAutoMovieGeometry =
  | IAutoMoviePrimitiveGeometry
  | IAutoMovieMeshGeometry
  | IAutoMovieBicubicAtlasGeometry;
