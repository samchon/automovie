import { autoMovieProjectSliceFilename } from "./autoMovieProjectSliceFilename";

/**
 * Throw when any supplied keys produce the same lowercase encoded .json filename. Exact duplicate iterable keys also refuse, although Map callers may have coalesced raw duplicates already. This is prewrite identity admission only and changes no resident files.
 *
 * @evidence contracts/common.md#principled-implementation A map of lowercased encoded filenames rejects repeated portable names before slate staging.
 * @evidence contracts/common.md#clear-and-simple-design Owns selected-directory identity admission independently of serialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact duplicate iterable keys also refuse; caller maps have already coalesced identical raw keys.
 * @evidence contracts/common.md#meaningful-documentation States prewrite refusal and case-folded filename domain.
 * @evidence contracts/performance.md#efficient-algorithms Visits N keys with encoding/folding text cost and N retained temporary names.
 * @evidence contracts/performance.md#reuse-equivalent-work One map serves the entire supplied population; no cross-cycle verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local keys expire after return/throw; no resident mutation occurs.
 */
export const autoMovieProjectAssertNoCaseCollisions: (dir: string, keys: Iterable<string>) => void = (dir: string, keys: Iterable<string>): void => {
    const byLowerName: Map<string, string> = new Map<string, string>();
    for (const key of keys) {
        const lower: string = autoMovieProjectSliceFilename(key).toLowerCase();
        const prior: string | undefined = byLowerName.get(lower);
        if (prior !== undefined)
            throw new Error(`${dir} ids "${prior}" and "${key}" collide case-insensitively as "${autoMovieProjectSliceFilename(key)}"; case-insensitive filesystems would silently clobber one, rename one id`);
        byLowerName.set(lower, key);
    }
};
