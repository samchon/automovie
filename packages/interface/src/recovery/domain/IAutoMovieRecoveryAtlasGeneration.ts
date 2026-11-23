import type {
  IAutoMovieBicubicAtlasTessellation64,
  IAutoMovieMesh,
  IAutoMovieRecoveryAtlasPrimitiveRange,
  IAutoMovieRecoveryAtlasRealization,
} from "../../index";

/** Retained atlas mesh and optional same-field construction data. */

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
