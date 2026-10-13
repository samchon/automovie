import {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieExplicitInstanceTransform,
} from "@automovie/interface";

/**
 * The stable address of one compact instance-set member.
 *
 * An explicit layout member is `instance:<set>:<explicit id>`, the id its
 * author wrote; every other member is `instance:<set>:slot:<slot>` with the
 * slot zero-padded to six digits, so slot order and address order agree up to
 * a million members. The slot is not range-checked here; an explicit layout
 * with no transform for the slot falls back to the slot form.
 *
 * @param set Compiled set the member belongs to.
 * @param slot Zero-based member slot.
 * @returns The member's address.
 *
 * @evidence contracts/common.md#principled-implementation An explicit member keeps its authored identity and a generated member is named by its deterministic slot, so the same member gets the same address in every revision that keeps its slot or explicit id; zero padding makes lexicographic and numeric slot order coincide below a million members.
 * @evidence contracts/common.md#clear-and-simple-design One owner of the member address grammar, read by instance-set member pages and paired with `autoMovieInstanceAddressSlot`, which parses it back.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No set or slot is special-cased; the explicit-id and slot forms follow from the layout alone.
 * @evidence contracts/common.md#meaningful-documentation The documentation states both forms, the padding and the order it preserves, and that the slot is not range-checked.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant work per call, one array index and one string template, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure formatter of one member that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates the padded slot text and the returned address string, and retains neither.
 */
export const autoMovieInstanceAddress = (
  set: IAutoMovieCompiledInstanceSet,
  slot: number,
): string => {
  const explicit: IAutoMovieExplicitInstanceTransform | undefined =
    set.layout.kind === "explicit" ? set.layout.transforms[slot] : undefined;
  return explicit === undefined
    ? `instance:${set.id}:slot:${String(slot).padStart(6, "0")}`
    : `instance:${set.id}:${explicit.id}`;
};
