import { IAutoMovieSurface } from "@automovie/interface";

import { IAutoMovieFootprint } from "./IAutoMovieFootprint";

/**
 * Prepared footprint for one surface. Build once when checking many points
 * against the same static polygon.
 *
 * @evidence contracts/development/design.md#principled-representation prepareSurface couples the source height/identity record to a footprint whose authored rings preserve concavity and holes; binary64 shoelace and tolerance predicates retain their numerical premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Source surface and prepared region form one pair shared by containment, height selection and support queries, avoiding separate competing hull representations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Preparation preserves the rings rather than filling notches or atria; it does not independently validate topology or repair malformed input.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies authoritative source borrowing and prepared planar copies; source polygon mutation requires rebuilding this pair to avoid stale projection/area.
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
