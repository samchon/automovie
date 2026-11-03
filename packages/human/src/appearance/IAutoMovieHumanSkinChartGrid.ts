/** Flattened polar grid of one chart. */
export interface IAutoMovieHumanSkinChartGrid {
  /** First station in mm. */
  lo: number;

  /** Station step in mm. */
  step: number;

  /** Station rows. */
  rows: number;

  /** Angular sectors, a multiple of 16, so the front reference and the overlap fall on nodes. */
  sectors: number;

  /** Extra sectors continuing the grid past the cut, a sixteenth of a turn. */
  overlap: number;

  /** Sampled radius per row and sector node, `rows * sectors`. */
  radius: Float64Array;

  /** Coordinates per row and extended node, `rows * (sectors + overlap + 1)`, interleaved u, v. */
  uv: Float64Array;

  /** Local frame per extended node: section direction then in-surface perpendicular, 6 numbers each. */
  frame: Float64Array;
}
