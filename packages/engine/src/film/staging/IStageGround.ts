import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One actor's window starts and world-ground locator.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes authored starts from all eligibility changes, gives the shot-local clock and documents both absent ground results.
 * @evidence contracts/development/design.md#principled-representation Ordered starts identify authored windows. Separate exact boundaries include timed surface openings, and the locator preserves distinct suspended and uncovered results in world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shot stance admission consumes both clocks and reads the same actor's ground through this prepared result.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Ground selection remains behind the prepared locator. Consumers do not reconstruct window indices or fall back from an explicit scope to scene-wide ground.
 */
export interface IStageGround {
  /** Exact shot-local changes to the set of eligible surfaces. */
  boundaries: readonly number[];

  /** Explicitly authored scope starts in shot seconds. */
  windowStarts: readonly number[];

  /**
   * Index of the authored window active at a shot-local second.
   *
   * @param time The query in shot-local seconds.
   * @returns The zero-based index of the last inclusive start.
   * @evidence contracts/development/common.md#meaningful-documentation States the time base, indexing and inclusive boundary convention.
   * @evidence contracts/development/implementation.md#principled-implementation The prepared reader binary searches the admitted nonempty sequence of increasing starts, whose first start is zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Ground queries and stance validation use the same reader to interpret the authored window clock.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A query on a window start belongs to the new window exactly, without rounding to the stance sampling grid.
   * @evidence contracts/development/implementation.md#efficient-algorithms A query takes logarithmic work in the number of authored starts and uses constant extra space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The reader shares its fixed ordered starts with all queries of this prepared actor and does not memoize query results.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure holds only that actor's starts while retained by the prepared table. A query keeps no result or external resource.
   */
  indexAt: (time: number) => number;

  /**
   * The admitted world height, null for ungrounded and undefined for explicitly suspended.
   *
   * @param time The query in shot-local seconds.
   * @param point The world point in metres. XZ selects coverage, and Y ranks overlapping surfaces.
   * @returns The support height in world metres or the applicable absence result.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the clock, point frame, metre units, overlap purpose and both absence values.
   * @evidence contracts/development/implementation.md#principled-implementation Finds the current window and reads the heights of its available covering surfaces. The least absolute difference from world Y wins, retaining listed order on ties.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The prepared actor owns time and eligibility, while the surface helpers own footprint coverage and height evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No scene-wide surface substitutes for an empty window or an uncovered point. A surface's availability is tested at the exact query time.
   * @evidence contracts/development/implementation.md#efficient-algorithms A logarithmic window lookup precedes one availability, coverage and height scan limited to that window's surfaces.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Footprint preparation shares the referenced surface geometry across windows and actors within the unchanged admitted stage.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the prepared table and keeps its window arrays and borrowed surface data for its lifetime. No point or result is retained by a query.
   */
  at: (time: number, point: IAutoMovieVector3) => number | null | undefined;
}
