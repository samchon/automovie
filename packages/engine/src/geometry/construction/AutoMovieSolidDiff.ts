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
 * @evidence contracts/development/common.md#meaningful-documentation States the kept sides and what the join provides.
 * @evidence contracts/development/design.md#principled-representation Represents The solid diff: a lofted cutter subtracted from its base, with a G2 rim blend along the cut: companion namespace of 1 member (`create`); units and frames named in its text: second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidDiff` in packages/engine/src/geometry/construction/AutoMovieSolidDiff.ts; its surface is the 1 member listed and the text shows 4 other files naming it, mostly packages/engine (3), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
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
   * @evidence contracts/development/implementation.md#principled-implementation Selects the shared join's inside kept side for the cutter, leaving contact tracing, rails and boundary ribbons with their existing geometry owners.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One direct call expresses the diff-specific choice without a second intersection or blend implementation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Forwards the input and the join's nullable-result/diagnostics unchanged, with no material-side compensation, retry or replacement surface.
   * @evidence contracts/development/common.md#meaningful-documentation Names cutter/host roles, inside keep and the actual result record's failure meaning.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds constant wrapper work to one complete shared join operation; its trace/rail/fold-check costs are not removed by this delegation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same join implementation as merge and forwards any supplied trace for the join owner to reuse; no result cache is added here.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller receives the join result and its transitive records/caches; this wrapper retains no input or resource after returning.
   */
  export function create(
    input: AutoMovieSolidJoin.IInput,
  ): AutoMovieSolidJoin.IResult {
    return AutoMovieSolidJoin.create(input, "inside");
  }
}
