import type { IAutoMoviePlanContourSlabs64Group } from "./IAutoMoviePlanContourSlabs64Group";

/**
 * Owned group list for one pair of adjacent retained cuts, produced in increasing
 * upper-cut order. No slab is produced when fewer than two cuts are retained.
 *
 * @evidence contracts/development/design.md#principled-representation k addresses the upper cut; group side indices address rings[k-1] and rings[k], not global ring ordinals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Boundary preparation and contour emission consume the planner's same interval/group hierarchy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Empty or unsupported groups remain explicit; the interval record claims no manifold or geometric qualification.
 * @evidence contracts/development/common.md#meaningful-documentation Defines index base, ordering and empty-input behavior.
 */
export interface IAutoMoviePlanContourSlabs64Slab {
  /** Upper saved-cut index, from 1 through slices.length-1; the lower index is k-1. */
  k: number;

  /** Newly allocated incidence groups, including local omissions and possibly an empty list when both sides have no work. */
  groups: IAutoMoviePlanContourSlabs64Group[];
}
