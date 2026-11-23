import type { IAutoMoviePlanContourSlabs64Group } from "./IAutoMoviePlanContourSlabs64Group";

/**
 * Owned group list for one pair of adjacent retained cuts, produced in
 * increasing upper-cut order. No slab is produced when fewer than two cuts are
 * retained.
 */
export interface IAutoMoviePlanContourSlabs64Slab {
  /**
   * Upper saved-cut index, from 1 through slices.length-1; the lower index is
   * k-1.
   */
  k: number;

  /**
   * Newly allocated incidence groups, including local omissions and possibly an
   * empty list when both sides have no work.
   */
  groups: IAutoMoviePlanContourSlabs64Group[];
}
