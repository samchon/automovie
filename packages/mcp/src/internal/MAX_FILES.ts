

/** Maximum number of files admitted into one authored-layer inventory.
 *
 * The 10,000-entry limit admits the exact boundary and refuses the next Markdown inventory entry.
 * One named inventory ceiling serves both native walking and injected-reader admission.
 * Counts are policy boundaries, not fixture-specific limits or success truncation.
 * The comment identifies maximum authored-layer inventory entries.
 * Scalar comparison is O(1) per admission while traversal and sorting remain owner costs.
 * Native and injected paths share this limit rather than maintaining divergent counts.
 * One scalar persists without retaining inventories or file contents.
 */
export const MAX_FILES: number = 10_000;
