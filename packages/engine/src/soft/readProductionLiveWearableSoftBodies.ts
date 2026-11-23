/** Admit and copy the authored ordered production live-soft id list. Nonarrays, blank/untrimmed strings and duplicates throw; id existence and moving-boundary compatibility belong to shot selection.
 */
export const readProductionLiveWearableSoftBodies: (
  selected: unknown,
) => string[] = (selected: unknown): string[] => {
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
