import {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieExplicitInstanceTransform,
} from "@automovie/interface";

/*
 * The stable address of one compact instance-set member.
 *
 * An explicit layout member is `instance:<set>:<explicit id>`, the id its
 * author wrote; every other member is `instance:<set>:slot:<slot>` with the
 * slot zero-padded to six digits, so slot order and address order agree up to a
 * million members. The slot is not range-checked here; an explicit layout with
 * no transform for the slot falls back to the slot form.
 * Parameter set: Compiled set the member belongs to.
 * Parameter slot: Zero-based member slot.
 * Returns: The member's address.
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
