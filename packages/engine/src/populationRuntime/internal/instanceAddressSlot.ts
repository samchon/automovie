import {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieExplicitInstanceTransform,
} from "@automovie/interface";

/*
 * The slot one compact-member address names in a set, or null when it names no
 * member of that set.
 *
 * The inverse of `instanceAddress` for members inside the set: an
 * explicit layout matches its transforms' ids, any other layout parses exactly
 * six digits after `instance:<set>:slot:`. A slot at or past `set.count` is
 * null, so an address left over from a larger revision does not resolve.
 * Parameter set: Compiled set to search.
 * Parameter address: Address to resolve.
 * Returns: The zero-based slot, or null.
 */
export const instanceAddressSlot = (
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
