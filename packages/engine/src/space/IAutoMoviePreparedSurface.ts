import { IAutoMovieSurface } from "@automovie/interface";

import { IAutoMovieFootprint } from "./IAutoMovieFootprint";

/**
 * Prepared footprint for one surface. Build once when checking many points
 * against the same static polygon.
 *
 * @evidence contracts/common.md#principled-implementation prepareSurface couples the source height/identity record to a footprint whose authored rings preserve concavity and holes; binary64 shoelace and tolerance predicates retain their numerical premises.
 * @evidence contracts/common.md#clear-and-simple-design Source surface and prepared region form one pair shared by containment, height selection and support queries, avoiding separate competing hull representations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preparation preserves the rings rather than filling notches or atria; it does not independently validate topology or repair malformed input.
 * @evidence contracts/common.md#meaningful-documentation Identifies authoritative source borrowing and prepared planar copies; source polygon mutation requires rebuilding this pair to avoid stale projection/area.
 * @evidence contracts/performance.md#efficient-algorithms E total vertices take O(E) preparation time and planar storage, while repeated containment remains O(E) edge work without new projection arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work The footprint's projections and signed areas are reused while source vertices remain unchanged; identity and height continue to come from the borrowed surface record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the prepared footprint and retains source surface/point references through it; discarding the pair releases those references without host resources.
 */
export interface IAutoMoviePreparedSurface {
  /** The source surface whose height/identity remains authoritative. */
  readonly surface: IAutoMovieSurface;

  /**
   * The authored rings of {@link IAutoMovieSurface.polygon} and its holes,
   * with planar copies and signed areas prepared for repeated queries.
   */
  readonly footprint: IAutoMovieFootprint;
}
