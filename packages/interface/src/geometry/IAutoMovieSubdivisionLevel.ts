import type { IAutoMovieSubdivisionTopology } from "./IAutoMovieSubdivisionTopology";

/**
 * A level's control positions, connectivity and corner-aligned subdivision
 * data.
 *
 * Each face corner retains its own cage chart address. Multiple corners of the
 * same level vertex can have different addresses. A quad cage face uses the
 * internal sub-face sentinel -1, which the public vertex parameter returns as
 * null. UV value indices use the same corner order as the topology.
 */
export interface IAutoMovieSubdivisionLevel {
  /** Connectivity and edge sharpness. */
  topology: IAutoMovieSubdivisionTopology;

  /** Packed vertex positions in metres. */
  positions: number[];

  /** Packed UV values, or `null` without UVs. */
  uvs: number[] | null;

  /** UV value ordinal of every face corner, or null without UVs. */
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
