import type { IAutoMoviePlanContourSlabs64Group } from "./IAutoMoviePlanContourSlabs64Group";

/**
 * Planned incidence for one adjacent pair of retained cuts. Slabs appear in
 * increasing upper-cut order. Fewer than two cuts produce an empty plan.
 */
export interface IAutoMoviePlanContourSlabs64Slab {
  /**
   * Upper saved-cut index, from 1 through slices.length-1; the lower index is
   * k-1.
   */
  k: number;

  /**
   * Newly allocated incidence groups, including local omissions. A slab without
   * work on either side can retain an empty group array.
   */
  groups: IAutoMoviePlanContourSlabs64Group[];
}
