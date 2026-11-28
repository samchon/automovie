/**
 * Borrowed incidence group for one pair of adjacent cuts. Boundary preparation
 * uses the group object as its interaction-map key and writes local refusal
 * reasons on that same object.
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
   * Mutable omission reason. Preparation preserves a prior reason, otherwise
   * copies the first unsupported incident ring's reason before interaction
   * refinement. A slit failure can record a reason after refinement.
   */
  unsupported?: string;
}
