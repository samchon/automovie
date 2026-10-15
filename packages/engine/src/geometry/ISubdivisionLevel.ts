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
 * @evidence contracts/common.md#principled-implementation Positions are vertex data and UVs and parameters are face-varying data, the split OpenSubdiv makes, so each refines by its own rule over the same topology.
 * @evidence contracts/common.md#clear-and-simple-design Everything one refinement step reads and writes, in flat arrays aligned with the topology's vertices and corners; `cage` marks the only level whose non-quad faces need the sub-face parameter split.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UVs are either fully present or `null` together with their corner indices.
 * @evidence contracts/common.md#meaningful-documentation States why parameters are per corner, the meaning of `-1`, and the alignment of every array.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; refinement cost is answered on `refineSubdivisionLevel`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each level is built once from its parent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Arrays linear in the level's vertices, UV values and corners; the subdivider keeps only the current level, so a parent is released once its child exists.
 * @author Samchon
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
