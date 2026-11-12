/**
 * The instants a motion case's capture draws, each named by the case's own label: one per second written to the millisecond, the resolution a capture names its cells at.
 *
 * Instants a case lists twice within one millisecond, such as a grip closing at the same frame a release begins, are one still, kept at the first second listed and named by every distinct label joined with ` / `, so no beat's name is lost. Order is the case's.
 *
 * @param times The case's instants, each with its label.
 * @returns The instants drawn, with their labels.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the resolution and why, how coinciding instants merge and keep their names, and the order.
 * @evidence contracts/development/implementation.md#principled-implementation A capture names a cell by its second to the millisecond and refuses two cells of one name, so instants that write alike are one cell; their labels are joined rather than one chosen.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One map keyed by the millisecond text, read back in insertion order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No instant is dropped without its label, and a repeated label is written once.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the instants.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure mapping of one case's times.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and keeps nothing.
 */
export function planMotionCaptureInstants(
  times: readonly { seconds: number; label: string }[],
): { seconds: number; label: string }[] {
  const instants: Map<string, { seconds: number; labels: string[] }> = new Map();
  for (const time of times) {
    const key: string = time.seconds.toFixed(3);
    const known: { seconds: number; labels: string[] } | undefined = instants.get(key);
    if (known === undefined) instants.set(key, { seconds: time.seconds, labels: [time.label] });
    else if (!known.labels.includes(time.label)) known.labels.push(time.label);
  }
  return [...instants.values()].map(
    (instant: { seconds: number; labels: string[] }): { seconds: number; label: string } => ({
      seconds: instant.seconds,
      label: instant.labels.join(" / "),
    }),
  );
}
