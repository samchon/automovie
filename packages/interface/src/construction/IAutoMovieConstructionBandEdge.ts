import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A carried band and its correspondence to the child.
 *
 * @evidence contracts/development/design.md#principled-representation The surface and both directions of one monotone rail correspondence in station millimetres and clock radians.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The port and split edge builders return the same surface and correspondence readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The maps are the band's own correspondence, not a nearest search.
 * @evidence contracts/development/common.md#meaningful-documentation States each reader's charts.
 */
export interface IAutoMovieConstructionBandEdge {
  /** The band's surface, the strip's chart, name, orientation, period and domain. */
  surface: IAutoMovieSolidSurface;

  /**
   * The child's chart point on its rail at a band clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the chart.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared callback slot; the engine's port and split band builders implement it.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared callback slot has no body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared callback slot has no body.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared callback slot has no body.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared callback slot coordinates no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared callback slot retains nothing.
   */
  rail: (clock: number) => [number, number];

  /**
   * The band clock whose rail point stands at a child phase, in `[0, 2 pi)`: the inverse of the monotone correspondence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the range.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared callback slot; the engine's port and split band builders implement it.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared callback slot has no body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared callback slot has no body.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared callback slot has no body.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared callback slot coordinates no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared callback slot retains nothing.
   */
  clock: (phase: number) => number;
}
