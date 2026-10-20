/**
 * Ordered elevation rings and evenly spaced positive-integer azimuth count for a deterministic inspection plan. Finite positive distance factor defaults to 1.25; rounded labels must remain unique.
 *
 * @evidence contracts/common.md#principled-implementation Counts azimuth samples per supplied elevation and applies one distance multiplier; labels use rounded whole degrees, so distinct angles may collide and refuse.
 * @evidence contracts/common.md#clear-and-simple-design The options describe planning only; bounds-dependent camera placement and actual observation remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type is not numeric admission; generation currently checks count/ring emptiness, nonpositive multiplier and label collisions but not all finite values or a population cap.
 * @evidence contracts/common.md#meaningful-documentation States defaults, ring order, label uniqueness and input admission limitations.
 * @evidence contracts/performance.md#efficient-algorithms For E rings and A samples the owning generator creates O(E*A) viewpoints; these inputs have no practical size cap.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller may reuse an unchanged plan, but generation returns fresh records and does not cache or claim they were rendered.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The options borrow elevation values and own no scene or task; generated arrays remain the consumer's retained population.
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
