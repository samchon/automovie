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
 * the base's outside by the tessellation; the blend between is the rim, convex
 * because it turns from the base's surface down into the recess.
 *
 * A recess whose floor stays single-valued along its base's rays keeps the
 * radial carve (`AutoMovieHumanSeamCarve`), which is the same G2 cut for a
 * graph. A cut through the skin (an eye fissure, the mouth) is a trim in the
 * skin's chart (`AutoMovieSolidTrim`), not a diff, because nothing is
 * left behind it to blend to.
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
   * @returns The join, the cutter kept inside the base, or null with the
   *   diagnostics of every broken premise.
   */
  export function create(input: AutoMovieSolidJoin.IInput): AutoMovieSolidJoin.IResult {
    return AutoMovieSolidJoin.create(input, "inside");
  }
}
