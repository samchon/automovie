/**
 * Ordered elevation rings and evenly spaced positive-integer azimuth count for a deterministic inspection plan. Finite positive distance factor defaults to 1.25; rounded labels must remain unique.
 *
 * @evidence contracts/development/design.md#principled-representation Counts azimuth samples per supplied elevation and applies one distance multiplier; labels use rounded whole degrees, so distinct angles may collide and refuse.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The options describe planning only; bounds-dependent camera placement and actual observation remain separate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type is not numeric admission; generation currently checks count/ring emptiness, nonpositive multiplier and label collisions but not all finite values or a population cap.
 * @evidence contracts/development/common.md#meaningful-documentation States defaults, ring order, label uniqueness and input admission limitations.
 */
export interface IAutoMovieViewerTurntableOptions {
  /**
   * Evenly spaced azimuths per elevation ring, at least one.
   */
  azimuthCount: number;

  /**
   * Elevation rings in degrees, in the order they are walked.
   */
  elevationsDeg: readonly number[];

  /**
   * Distance multiplier every generated viewpoint carries. Defaults to `1.25`, which leaves a margin around the subject rather than cropping it to the viewport edge.
   */
  distanceFactor?: number;
}
