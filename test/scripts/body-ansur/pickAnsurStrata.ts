/**
 * Choose `count` measured people spread evenly over the 1st to 99th
 * percentile of one ordering quantity, so a census sees the thin and the
 * heavy tail of a population as well as its middle.
 *
 * The rows are ordered by `key` ascending (ties keep file order, so the choice
 * is deterministic), and stratum `i` takes the row at rank
 * `round(p_i * (n - 1))` with `p_i = 0.01 + 0.98 * i / (count - 1)`. The
 * extreme order statistics are skipped on purpose: the minimum and maximum of
 * a survey are often recording outliers. A row that lacks the key is not part
 * of the population being ordered and is skipped. A single stratum takes the
 * median. The result holds the original row objects, unmodified.
 */
export function pickAnsurStrata<T extends Record<string, number>>(
  rows: readonly T[],
  key: (row: T) => number,
  count: number,
): T[] {
  if (!Number.isInteger(count) || count < 1)
    throw new Error(`A stratum count is a positive integer: ${count}`);
  const ordered = rows
    .map((row, index) => ({ row, index, value: key(row) }))
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => a.value - b.value || a.index - b.index);
  if (ordered.length === 0) throw new Error("No row carries the ordering key.");
  return Array.from({ length: count }, (_, i) => {
    const p = count === 1 ? 0.5 : 0.01 + (0.98 * i) / (count - 1);
    return ordered[Math.round(p * (ordered.length - 1))].row;
  });
}
