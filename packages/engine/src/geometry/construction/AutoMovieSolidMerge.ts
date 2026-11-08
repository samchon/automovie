import { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";

/**
 * The solid merge: one lofted part attached to its host by the curve where
 * their surfaces meet and a G2 blend along it, the union of the two solids.
 *
 * The part is built whole in its own frame and runs into the host (an arm tube
 * into the trunk past the axilla, a leg into the pelvis, a finger into the
 * palm, the neck into the head); the host is built as if the part did not
 * exist. The merge finds their intersection curve
 * (`AutoMovieSolidIntersection`), trims the part back to a rail on its
 * outside part and the host back to a rail outside the part
 * (`AutoMovieSolidRail`), and spans the two rails by the quintic blend
 * that copies both surfaces' 2-jets (`AutoMovieSolidBlend`), so the
 * merged skin is G2 across both rails. What the two solids leave is the
 * union: a branch (one loop becoming two) and an overhang need no special
 * case, because neither surface is a graph over the other.
 *
 * Width laws belong to the authoring construction and are read in the curve's declared parameter. This wrapper supplies no consumer-specific relief or local assembly alternative.
 *
 * Nearby joins require compatible kept regions and rails. The shared join/body operators report premises they cannot keep; this wrapper does not resolve overlapping blends by a separate patch.
 *
 * @evidence contracts/common.md#principled-implementation A merge is the join that keeps the part outside the host and the host outside the part.
 * @evidence contracts/common.md#clear-and-simple-design One call into the shared join with the outside keep.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every failure is the join's diagnostic; nothing is retried.
 * @evidence contracts/common.md#meaningful-documentation States the kept sides and the join it composes.
 * @evidence contracts/performance.md#efficient-algorithms Costs exactly one join.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the diff's code path.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the join result and keeps nothing.
 */
export namespace AutoMovieSolidMerge {
  /**
   * Merge a part onto its host.
   *
   * @param input The part (periodic phase), the host, the seed from the
   *   contact's landmarks, the trace's limits and the width laws.
   * @returns The shared result with an outside-kept part, or a null join and diagnostics for its detected contact/rail/blend failure.
   *
   * @evidence contracts/common.md#principled-implementation Selects the shared join's outside part keep, expressing the merge boundary convention through the existing trace/rail/ribbon construction.
   * @evidence contracts/common.md#clear-and-simple-design One direct delegation keeps the merge/diff distinction at the kept-side argument.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves shared join diagnostics and null failures without retrying, shrinking widths or calling a consumer-local union path.
   * @evidence contracts/common.md#meaningful-documentation Gives part/host roles, outside keep and the result's nullable join/diagnostic meaning.
   * @evidence contracts/performance.md#efficient-algorithms Constant wrapper work plus the full shared join cost, including tracing, rails, repeated columns and fold checks.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the diff's common implementation and any supplied trace under the join's existing contract, without new cross-call state.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned join result and its owned/borrowed dependency graph escape; the wrapper itself retains nothing.
   */
  export function create(
    input: AutoMovieSolidJoin.IInput,
  ): AutoMovieSolidJoin.IResult {
    return AutoMovieSolidJoin.create(input, "outside");
  }
}
