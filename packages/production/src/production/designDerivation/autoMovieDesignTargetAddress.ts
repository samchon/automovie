import type { IAutoMovieDesignTarget } from "@automovie/interface";

/**
 * Spell a design target's logical address without changing its id.
 *
 * @evidence contracts/common.md#principled-implementation Production/world are singleton addresses; every other supported target combines kind and its unchanged quoted id.
 * @evidence contracts/common.md#clear-and-simple-design One spelling is exported for emitter and inspection consumers instead of independently formatting target identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The formatter performs no id admission or escaping and does not prove a record exists; callers supply the canonical typed target.
 * @evidence contracts/common.md#meaningful-documentation Documents singleton versus kind/id address semantics and preserves the original id text.
 * @evidence contracts/performance.md#efficient-algorithms Singleton selection is fixed work; other addresses allocate text proportional to kind and id length.
 * @evidence contracts/performance.md#reuse-equivalent-work No address cache is retained; sharing a spelling does not equate different producer bases or record bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned text escapes, with no retained target, store or native resource.
 */
export function autoMovieDesignTargetAddress(
  target: IAutoMovieDesignTarget,
): string { return target.kind === "production" || target.kind === "world"
    ? target.kind
    : `${target.kind} "${target.id}"`; }
