/**
 * Read the production-wide live-soft budget order exactly as authored.
 *
 * `simulation.liveWearableSoftBodies` is the author's explicit choice of which
 * wearable soft bodies run as live deterministic solves, and its order is the
 * order budget slots are assigned in. Anything other than an array of
 * non-blank, trimmed, unique ids is refused rather than repaired, so the Node
 * builder and a browser viewer reading the fetched runtime admit one list.
 */
export const readProductionLiveWearableSoftBodies = (
  selected: unknown,
): string[] => {
  if (Array.isArray(selected) === false)
    throw new Error(
      "simulation.liveWearableSoftBodies must be an array of domain ids.",
    );
  const ids = new Set<string>();
  return selected.map((entry: unknown, index) => {
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
    return entry;
  });
};
