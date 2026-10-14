/**
 * Caller-owned atlas-area observer output, with dimensionless extrema over retained triangles and a count of omitted small-surface triangles. Empty/no-retained input keeps +Infinity/-Infinity extrema; malformed or overflowing arithmetic can propagate NaN, so this record is not a mesh-validity verdict.
 *
 * The loft/revolve tests require finite expected extrema and zero omissions to prevent an empty or shrinking measured population from passing. This type owns no runtime work, cache or host resource.
 */
export interface IAtlasDensityRange {
  /** Least emitted-uv-area over surface-area; below 1 the texels are stretched. */
  least: number;

  /** Greatest of the same ratio; above 1 the texels are crowded. */
  most: number;

  /** Triangles with surface area at or below 1e-12, excluded from both extrema. */
  degenerate: number;
}
