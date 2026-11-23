/**
 * One chained piece of a section: the crossings of consecutive triangles in
 * order.
 */
export interface IAutoMovieMeshSectionChain {
  /**
   * The chain's points as `[a, b]` millimetres about the station's axis point,
   * `a` and `b` the section's in-plane axes (see
   * {@link IAutoMovieMeshSectionCut.extremes}); coincident consecutive crossings
   * are merged, a closed loop's last point is not repeated.
   */
  points: [number, number][];

  /**
   * Whether the chain closes on itself; an open chain is a hole, gap or broken
   * slice.
   */
  closed: boolean;
}
