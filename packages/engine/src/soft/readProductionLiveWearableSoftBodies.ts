
/** Admit and copy the authored ordered production live-soft id list. Nonarrays, blank/untrimmed strings and duplicates throw; id existence and moving-boundary compatibility belong to shot selection.
 *
 * @evidence contracts/common.md#principled-implementation Indexed slot admission and a code-unit string Set preserve the author's exact budget order without coercion; holes are refused at their index instead of becoming phantom slots. This reader reaches the selection API and tests, not an installed production/viewer live host.
 * @evidence contracts/common.md#clear-and-simple-design One list reader separates unknown-record admission from per-shot domain matching, keeping budget slot order independent of compiled domain order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No trim, sort, deduplication or inferred live subject repairs an invalid author choice.
 * @evidence contracts/common.md#meaningful-documentation States input shape, failures, order ownership and actual host reach.
 * @evidence contracts/performance.md#efficient-algorithms For N selected slots and L total string units, indexed admission, trimming and Set membership take expected O(N+L) time and O(N) output/temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One Set validates the full list once and is reused across entries; different mutable input arrays do not share a cached admission result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The Set is local and a fresh string array transfers to the caller; no original array, actor or runtime handle is retained.
 *
 * @author Samchon
 */
export const readProductionLiveWearableSoftBodies: (selected: unknown) => string[] = (
  selected: unknown,
): string[] => {
  if (Array.isArray(selected) === false)
    throw new Error(
      "simulation.liveWearableSoftBodies must be an array of domain ids.",
    );
  const ids: Set<string> = new Set<string>();
  const output: string[] = [];
  const length: number = selected.length;
  for (let index: number = 0; index < length; ++index) {
    const entry: unknown = selected[index];
    if (
      typeof entry !== "string" ||
      entry.trim().length === 0 ||
      entry !== entry.trim()
    )
      throw new Error(
        `simulation.liveWearableSoftBodies[${index}] must be a non-blank trimmed string.`,
      );
    if (ids.has(entry))
      throw new Error(
        `simulation.liveWearableSoftBodies repeats domain id "${entry}".`,
      );
    ids.add(entry);
    output.push(entry);
  }
  return output;
};
