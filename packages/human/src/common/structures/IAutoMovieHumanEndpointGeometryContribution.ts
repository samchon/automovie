/**
 * Actual external geometry and its nonzero endpoint displacement rows.
 * Arrays remain source-owned metre data, not a permission or fitted target.
 *
 * @evidence contracts/common.md#principled-implementation Carries actual resident positions and sparse rows for endpoint ownership.
 * @evidence contracts/common.md#clear-and-simple-design Identity, positions and rows are the complete contribution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No invented displacement or empty marker substitutes for geometry.
 * @evidence contracts/common.md#meaningful-documentation States source ownership and the metre row layout.
 * @evidence contracts/modeling.md#spatial-conventions Positions and displacements retain the source metre frame.
 * @evidence contracts/modeling.md#parameter-channels Rows name an existing endpoint through the enclosing source record.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The enclosing source supplies its partition identity.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Preserves the source member identity.
 * @evidenceExclude contracts/modeling.md#rendered-observation Establishes no rendered acceptance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds no physiological value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Converts no personal input.
 */
export interface IAutoMovieHumanEndpointGeometryContribution {
  /** Actual source member identity. */
  id: string;
  /** Flat source XYZ metres, used to admit resident row indices. */
  positions: number[];
  /** Strictly increasing nonzero [index, dx, dy, dz] quadruples. */
  rows: number[];
}
