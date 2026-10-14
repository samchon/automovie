import {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieExplicitInstanceTransform,
} from "@automovie/interface";

/**
 * The slot one compact-member address names in a set, or null when it names
 * no member of that set.
 *
 * The inverse of `autoMovieInstanceAddress` for members inside the set: an
 * explicit layout matches its transforms' ids, any other layout parses exactly
 * six digits after `instance:<set>:slot:`. A slot at or past `set.count` is
 * null, so an address left over from a larger revision does not resolve.
 *
 * @param set Compiled set to search.
 * @param address Address to resolve.
 * @returns The zero-based slot, or null.
 *
 * @evidence contracts/common.md#principled-implementation Parses the slot form directly instead of generating every member's address, so resolving one member of a large compact set never expands it; an explicit layout is matched by its authored ids because those are its addresses.
 * @evidence contracts/common.md#clear-and-simple-design The parsing half of the member address grammar, kept beside `autoMovieInstanceAddress` so the two forms change together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No set or member is special-cased; a malformed or out-of-range address is null rather than coerced to a nearby slot.
 * @evidence contracts/common.md#meaningful-documentation The documentation states both forms, the exact digit count, the range rule and why it matters.
 * @evidence contracts/performance.md#efficient-algorithms Constant time for a generated layout and linear in the explicit transform count for an explicit one, never linear in a generated set's count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure parser of one address that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates at most a prefix and a suffix string and retains nothing.
 */
export const autoMovieInstanceAddressSlot = (
  set: IAutoMovieCompiledInstanceSet,
  address: string,
): number | null => {
  if (set.layout.kind === "explicit") {
    const slot: number = set.layout.transforms.findIndex(
      (transform: IAutoMovieExplicitInstanceTransform): boolean =>
        `instance:${set.id}:${transform.id}` === address,
    );
    return slot >= 0 && slot < set.count ? slot : null;
  }
  const prefix: string = `instance:${set.id}:slot:`;
  if (!address.startsWith(prefix)) return null;
  const suffix: string = address.slice(prefix.length);
  if (!/^\d{6}$/.test(suffix)) return null;
  const slot: number = Number(suffix);
  return slot < set.count ? slot : null;
};
