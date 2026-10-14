

/**
 * Filter building-bound records while retaining their original authored positions.
 *
 * Exact environment-string equality selects records in input order. New item and index arrays are parallel, and selected records remain borrowed references rather than deep copies.
 *
 * @evidence contracts/common.md#principled-implementation Stable filtering produces the local-to-program address mapping needed by building validators. Duplicate environment ids or record ownership are not validated here; the input records and selected building come from the shot program.
 * @evidence contracts/common.md#clear-and-simple-design One filter supplies both validator inputs and address indices, preventing independently reconstructed orders from disagreeing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No record is selected by a fixture name or normalized alias; unmatched records are handled by the outer unresolved-binding check, not silently admitted by this filter.
 * @evidence contracts/common.md#meaningful-documentation Documents exact selection, stable order, parallel zero-based indices and borrowed record ownership.
 * @evidence contracts/performance.md#efficient-algorithms For N records, one scan performs environment-text comparisons and stores K selected references/indices; surrounding building iteration repeats these scans for each environment.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned items and indices share one selection pass; results are not cached across a changed program or environment string.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous fold owns the new arrays until its findings are translated; original records remain caller-owned. No byte copy, handle or task is acquired and record population is uncapped here.
 */
export function productionEnvironmentBindings<T extends { environment: string }>(
  items: readonly T[],
  environment: string
): {
  /** Selected records in original order, retaining their caller-owned references. */
  items: T[];

  /** Parallel zero-based positions in the original list. */
  indices: number[];
} {
  const kept: T[] = [];
  const indices: number[] = [];
  items.forEach((item: T, index: number): void => {
    if (item.environment !== environment) return;
    kept.push(item);
    indices.push(index);
  });
  return { items: kept, indices };
}
