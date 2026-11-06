import { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";

/**
 * The solid diff: a lofted cutter subtracted from its base, with a G2 rim
 * blend along the cut.
 *
 * The cutter is a closed tube in its own frame (the orbit's bowl, a nostril's
 * vestibule, the navel's pit, a groove's channel); the base is built as if
 * the recess did not exist. The diff finds the curve where the two surfaces
 * meet (`AutoMovieSolidIntersection`), keeps the base outside the cutter
 * and the cutter inside the base, trims each back to a rail on its kept side
 * (`AutoMovieSolidRail`), and spans the rails by the quintic blend
 * that copies both surfaces' 2-jets (`AutoMovieSolidBlend`). The kept
 * piece of the cutter is the recess's wall and floor, its normal turned toward
 * the base's outside by the tessellation. The rim's quintic matches its boundary jets; that alone does not prove global convexity between them.
 *
 * A through-opening uses a chart trim (`AutoMovieSolidTrim`): there is no retained cutter wall behind that opening for this volume join to blend to. This wrapper owns no separate graph-carving algorithm or consumer-specific assembly.
 *
 * @evidence contracts/common.md#principled-implementation A diff is the join that keeps the cutter's wall inside the base and the base outside the cutter, blended G2 like a merge.
 * @evidence contracts/common.md#clear-and-simple-design One call into the shared join with the inside keep.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The kept sides come from the surfaces' normals; a cutter that misses the base is reported.
 * @evidence contracts/common.md#meaningful-documentation States the kept sides and what the join provides.
 * @evidence contracts/performance.md#efficient-algorithms Costs exactly one join.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the merge's trace, rail and blend code.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the join result and keeps nothing.
 */
export namespace AutoMovieSolidDiff {
  /**
   * Subtract a cutter from its base.
   *
   * @param input The cutter as the part (periodic phase), the base as the
   *   host, the seed from the recess's landmarks, the trace's limits and the
   *   rim's width laws.
   * @returns The shared join result; join is null on reported failure, otherwise the cutter is kept inside the base.
   *
   * @evidence contracts/common.md#principled-implementation Selects the shared join's inside kept side for the cutter, leaving contact tracing, rails and boundary ribbons with their existing geometry owners.
   * @evidence contracts/common.md#clear-and-simple-design One direct call expresses the diff-specific choice without a second intersection or blend implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Forwards the input and the join's nullable-result/diagnostics unchanged, with no material-side compensation, retry or replacement surface.
   * @evidence contracts/common.md#meaningful-documentation Names cutter/host roles, inside keep and the actual result record's failure meaning.
   * @evidence contracts/performance.md#efficient-algorithms Adds constant wrapper work to one complete shared join operation; its trace/rail/fold-check costs are not removed by this delegation.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the same join implementation as merge and forwards any supplied trace for the join owner to reuse; no result cache is added here.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives the join result and its transitive records/caches; this wrapper retains no input or resource after returning.
   */
  export function create(
    input: AutoMovieSolidJoin.IInput,
  ): AutoMovieSolidJoin.IResult {
    return AutoMovieSolidJoin.create(input, "inside");
  }
}
