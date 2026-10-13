

/** Maximum number of files admitted into one authored-layer inventory.
 *
 * Native walking and injected-reader admission share the inclusive 10,000-file ceiling and refuse the next entry instead of publishing a truncated population. The scalar comparison is O(1); traversal and sorting belong to their operations, and the process-owned constant retains no inventory or content.
 */
export const MAX_FILES: number = 10_000;
