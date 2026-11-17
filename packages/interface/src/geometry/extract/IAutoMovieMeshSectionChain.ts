/**
 * One chained piece of a section: the crossings of consecutive triangles in order.
 *
 * @evidence contracts/development/design.md#principled-representation Crossings are chained through the mesh edges they lie on, which two adjacent triangles share on a manifold.
 * @evidence contracts/development/design.md#minimal-and-owned-surface In-plane coordinates ready for reduceLoop, with a closed flag.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Raw section loops retain open chains. The section's separate outer publication may bridge within the admitted distance and records every bridged gap in its flags.
 * @evidence contracts/development/common.md#meaningful-documentation States the coordinates' axes and origin.
 */
export interface IAutoMovieMeshSectionChain {
  /**
   * The chain's points as `[a, b]` millimetres about the station's axis
   * point, `a` and `b` the section's in-plane axes (see {@link IAutoMovieMeshSectionCut.extremes});
   * coincident consecutive crossings are merged, a closed loop's last point
   * is not repeated.
   */
  points: [number, number][];

  /** Whether the chain closes on itself; an open chain is a hole, gap or broken slice. */
  closed: boolean;
}
