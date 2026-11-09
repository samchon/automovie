/**
 * Cubic support offsets over one physical Y interval.
 *
 * @evidence contracts/development/design.md#principled-representation Complete Bernstein profiles drive the fixed oriented support inequalities through the interval.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named contract is shared by the authoring model and its existing consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no geometry, inference, fallback or runtime behavior.
 * @evidence contracts/development/common.md#meaningful-documentation Defines physical station units, registry ordering, cubic coefficient order and exact neighboring endpoints.
 */
export interface IAutoMovieConvexSupportLoftSpan {
  /** Lower and upper physical Y coordinates, in metres. */
  interval: [number, number];

  /** Four Bernstein offsets per plane, in registry order and metres; adjacent spans share endpoints exactly. */
  offsets: [number, number, number, number][];
}
