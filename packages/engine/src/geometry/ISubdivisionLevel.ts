import { ISubdivisionTopology } from "./ISubdivisionTopology";

/**
 * One refinement level of a subdivision surface: its connectivity, vertex
 * positions, face-varying UVs and the cage parameters of every face corner.
 *
 * Parameters are per corner rather than per vertex because a vertex shared by
 * several cage faces has different local coordinates in each; the subdivider
 * reports the first corner's. `parameterCorners` is `-1` where the cage face is
 * a quad, as `IAutoMovieSubdivisionParameter.corner` is `null`.
 *
 * @evidence contracts/development/design.md#principled-representation Positions are vertex data and UVs and parameters are face-varying data, the split OpenSubdiv makes, so each refines by its own rule over the same topology.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Everything one refinement step reads and writes, in flat arrays aligned with the topology's vertices and corners; `cage` marks the only level whose non-quad faces need the sub-face parameter split.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts UVs are either fully present or `null` together with their corner indices.
 * @evidence contracts/development/common.md#meaningful-documentation States why parameters are per corner, the meaning of `-1`, and the alignment of every array.
 */
export interface ISubdivisionLevel {
  /** Connectivity and edge sharpness. */
  topology: ISubdivisionTopology;

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
