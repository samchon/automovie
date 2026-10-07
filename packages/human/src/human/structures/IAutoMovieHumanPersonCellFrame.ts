/**
 * The oriented frame of one source cell: a row-major 3x3 matrix whose columns
 * are the two edge tangents (metres) and the scaled unit normal, and the
 * cell's doubled area, the length of the tangents' cross product (square
 * metres), in the shared Y-up, +Z-forward frame.
 *
 * @evidence contracts/common.md#principled-implementation A cell differential is the map between two such frames, and the area sets the transverse scale.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both come from the actual cell points; no tolerance or default is applied.
 * @evidence contracts/common.md#meaningful-documentation States layout, columns, units and frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A frame defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A frame emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Tangents in metres and area in square metres, in the shared Y-up, +Z-forward frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Internal to one transport evaluation; it builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal arithmetic that is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical geometry, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry or compiled lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonCellFrame {
  /** Row-major 3x3 matrix of edge tangents and the scaled unit normal. */
  matrix: number[];

  /** Length of the tangents' cross product, square metres. */
  area: number;
}
