import { AutoMovieHumanSolidJoin } from "./AutoMovieHumanSolidJoin";

/**
 * The solid diff: a lofted cutter subtracted from its base, with a G2 rim
 * blend along the cut.
 *
 * The cutter is a closed tube in its own frame (the orbit's bowl, a nostril's
 * vestibule, the navel's pit, a groove's channel); the base is built as if
 * the recess did not exist. The diff finds the curve where the two surfaces
 * meet (`AutoMovieHumanSolidIntersection`), keeps the base outside the cutter
 * and the cutter inside the base, trims each back to a rail on its kept side
 * (`AutoMovieHumanSolidRail`), and spans the rails by the quintic blend
 * that copies both surfaces' 2-jets (`AutoMovieHumanSolidBlend`). The kept
 * piece of the cutter is the recess's wall and floor, its normal turned toward
 * the base's outside by the tessellation; the blend between is the rim, convex
 * because it turns from the base's surface down into the recess.
 *
 * A recess whose floor stays single-valued along its base's rays keeps the
 * radial carve (`AutoMovieHumanSeamCarve`), which is the same G2 cut for a
 * graph. A cut through the skin (an eye fissure, the mouth) is a trim in the
 * skin's chart (`AutoMovieHumanSolidTrim`), not a diff, because nothing is
 * left behind it to blend to.
 */
export namespace AutoMovieHumanSolidDiff {
  /**
   * Subtract a cutter from its base.
   *
   * @param input The cutter as the part (periodic phase), the base as the
   *   host, the seed from the recess's landmarks, the trace's limits and the
   *   rim's width laws.
   * @returns The join, the cutter kept inside the base, or null with the
   *   diagnostics of every broken premise.
   */
  export function create(input: AutoMovieHumanSolidJoin.IInput): AutoMovieHumanSolidJoin.IResult {
    return AutoMovieHumanSolidJoin.create(input, "inside");
  }
}
