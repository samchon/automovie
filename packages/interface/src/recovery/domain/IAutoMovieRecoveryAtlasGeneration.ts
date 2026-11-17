import type { IAutoMovieBicubicAtlasTessellation64, IAutoMovieMesh, IAutoMovieRecoveryAtlasPrimitiveRange, IAutoMovieRecoveryAtlasRealization } from "../../index";

/**
 * Retained atlas mesh and optional same-field construction data.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Generated model-space mesh in metres. Requested [u0,v0,u1,v1,u2,v2] values per retained triangle.
 * @evidence contracts/development/design.md#principled-representation Requested actual bound coefficient grids in millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface realizeAutoMovieRecoveryAnalyticDomains, realizeAutoMovieRecoveryTensorFamilies share IAutoMovieRecoveryAtlasGeneration's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Requested actual bound coefficient grids in millimetres.
 */

export interface IAutoMovieRecoveryAtlasGeneration extends IAutoMovieRecoveryAtlasRealization {
 
 /** Generated model-space mesh in metres. */
  mesh: IAutoMovieMesh;

 
 /** Requested [u0,v0,u1,v1,u2,v2] values per retained triangle. */
  triangleParameters?: number[];

 
 /** Requested actual bound coefficient grids in millimetres. */
  patchCoefficients?: NonNullable<
    IAutoMovieBicubicAtlasTessellation64.Summary["patchCoefficients"]
  >;

 
 /** Retained triangle intervals with generating chart bounds. */
  primitiveRanges: IAutoMovieRecoveryAtlasPrimitiveRange[];
}
