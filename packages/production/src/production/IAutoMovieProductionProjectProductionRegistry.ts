

/**
 * The tracked production registry, `automovie/productions.json`.
 *
 * It is portable identity only: the registered production ids and the design
 * layout they use, identical in every checkout of the same history. A resident
 * record may still carry the retired inline `incarnations` member. Validation
 * still refuses a malformed one, but no open reads it as a generation, and the
 * next registry publication drops it.
 *
 * @evidence contracts/common.md#principled-implementation Models portable tracked production identity separately from resident incarnation records; the registry validator admits versions, spelling and encoded lowercase collisions and returns sorted ids.
 * @evidence contracts/common.md#clear-and-simple-design One registry stores production membership and layout version, while physical generation fencing belongs to project/production incarnation files rather than a duplicate inline map.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Plain strings/numbers confer no admission proof; the validator rejects malformed retired inline incarnations before dropping them from normalized publication, and validates layoutVersion as 0 or 1.
 * @evidence contracts/common.md#meaningful-documentation Explains portable identity, accepted layout states and historical field retirement without promising schema validity from this structural type alone.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record chooses no processing algorithm; registry validation owns id-key checks, historical membership scans and code-unit sorting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Membership data is not a coordinator or reusable mutation result; fresh registry consumers reobserve it under their own namespace/currentness fences.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Tracked registry storage grows with registered productions; parsed normalized arrays transfer to callers and this type holds no descriptor, task or resident media bytes.
 * @author Samchon
 */
export interface IAutoMovieProductionProjectProductionRegistry {
    /** Tracked registry schema version. */
    version: 1;

    /** Zero for legacy singleton layout, one for production-scoped layout. */
    layoutVersion: number;

    /** Portable registered ids, normalized to code-unit order by admission. */
    productions: string[];
}
