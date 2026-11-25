/**
 * Shared slab-group view used by source interaction refinement and slit
 * preparation. The same group object keys the preparation result's interaction
 * map.
 */
export interface IAutoMoviePrepareContourBoundaries64Group {
  /**
   * Local ring indices in the lower section rings[k-1]; an empty side is
   * permitted for declared terminal incidence.
   */
  a: number[];
  /**
   * Local ring indices in the upper section rings[k]; preserves the declared
   * group correspondence.
   */
  b: number[];
  /**
   * Mutable local omission reason. Preparation fills it from the first
   * unsupported incident ring when no prior reason exists, then skips this
   * group.
   */
  unsupported?: string;
}
