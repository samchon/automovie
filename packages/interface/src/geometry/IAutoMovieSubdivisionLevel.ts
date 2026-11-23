import type { IAutoMovieSubdivisionTopology } from "./IAutoMovieSubdivisionTopology";

/**
 * One refinement level of a subdivision surface: its connectivity, vertex
 * positions, face-varying UVs and the cage parameters of every face corner.
 *
 * Parameters are per corner rather than per vertex because a vertex shared by
 * several cage faces has different local coordinates in each; the subdivider
 * reports the first corner's. `parameterCorners` is `-1` where the cage face is
 * a quad, as `IAutoMovieSubdivisionParameter.corner` is `null`.
 */
export interface IAutoMovieSubdivisionLevel {
  /** Connectivity and edge sharpness. */
  topology: IAutoMovieSubdivisionTopology;

  /** Packed vertex positions in metres. */
  positions: number[];

  /** Packed UV values, or `null` without UVs. */
  uvs: number[] | null;

  /** UV value of every corner, or `null` without UVs. */
  cornerUvs: number[] | null;

  /** Whether this is the admitted cage rather than a refined level. */
  cage: boolean;

  /** Cage face of every corner. */
  parameterFaces: number[];

  /** Sub-face corner of every corner, `-1` for a quad cage face. */
  parameterCorners: number[];

  /** First local coordinate of every corner. */
  parameterU: number[];

  /** Second local coordinate of every corner. */
  parameterV: number[];
}
