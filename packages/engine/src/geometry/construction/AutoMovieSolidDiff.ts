import type { IAutoMovieSolidJoin } from "@automovie/interface";

import { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";

/**
 * The solid diff: a lofted cutter subtracted from its base, with a G2 rim blend
 * along the cut.
 *
 * The cutter is a closed tube in its own frame (the orbit's bowl, a nostril's
 * vestibule, the navel's pit, a groove's channel); the base is built as if the
 * recess did not exist. The diff finds the curve where the two surfaces meet
 * (`AutoMovieSolidIntersection`), keeps the base outside the cutter and the
 * cutter inside the base, trims each back to a rail on its kept side
 * (`AutoMovieSolidRail`), and spans the rails by the quintic blend that copies
 * both surfaces' 2-jets (`AutoMovieSolidBlend`). The kept piece of the cutter
 * is the recess's wall and floor, its normal turned toward the base's outside
 * by the tessellation. The rim's quintic matches its boundary jets; that alone
 * does not prove global convexity between them.
 *
 * A through-opening uses a chart trim (`AutoMovieSolidTrim`): there is no
 * retained cutter wall behind that opening for this volume join to blend to.
 * This wrapper owns no separate graph-carving algorithm or consumer-specific
 * assembly.
 */
export namespace AutoMovieSolidDiff {
  /**
   * Subtract a cutter from its base.
   *
   * @param input The cutter as the part (periodic phase), the base as the host,
   *   the seed from the recess's landmarks, the trace's limits and the rim's
   *   width laws.
   * @returns The shared join result; join is null on reported failure,
   *   otherwise the cutter is kept inside the base.
   */
  export function create(
    input: IAutoMovieSolidJoin.IInput,
  ): IAutoMovieSolidJoin.IResult {
    return AutoMovieSolidJoin.create(input, "inside");
  }
}
