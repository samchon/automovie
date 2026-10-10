/**
 * Actual external geometry and its nonzero endpoint displacement rows.
 * Arrays remain source-owned metre data, not a permission or fitted target.
 */
export interface IAutoMovieHumanEndpointGeometryContribution {
  /** Actual source member identity. */
  id: string;
  /** Flat source XYZ metres, used to admit resident row indices. */
  positions: number[];
  /** Strictly increasing nonzero [index, dx, dy, dz] quadruples. */
  rows: number[];
}
