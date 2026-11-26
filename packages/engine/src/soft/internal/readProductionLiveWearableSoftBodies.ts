/**
 * Copy the authored ordered production live-soft id list. A repeated id throws;
 * id existence and moving-boundary compatibility belong to shot selection.
 */
export function readProductionLiveWearableSoftBodies(
  selected: readonly string[],
): string[] {
  const ids: Set<string> = new Set<string>();
  const output: string[] = [];
  for (const entry of selected) {
    if (ids.has(entry))
      throw new Error(
        `simulation.liveWearableSoftBodies repeats domain id "${entry}".`,
      );
    ids.add(entry);
    output.push(entry);
  }
  return output;
}
