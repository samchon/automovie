

/** Maximum aggregate source bytes observed for one layer revision.
 *
 * The 32 MiB ceiling limits aggregate copied source bytes used to establish one layer revision.
 * One named aggregate-byte limit remains separate from per-file and file-count limits.
 * The provider refuses overflow rather than publishing a partial source population.
 * The comment states aggregate observed-source bytes for one layer revision.
 * Checking the running byte total is O(1) per file, within the layer scan's full hashing cost.
 * One shared scalar governs all layer requests without caching their byte totals.
 * The scalar is module-owned; each request owns the bounded copied-source population.
 */
export const MAX_LAYER_BYTES: number = 33_554_432;
