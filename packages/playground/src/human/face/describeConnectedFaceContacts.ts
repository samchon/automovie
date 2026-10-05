import type { IAutoMovieModelCrossing } from "@automovie/engine";

/**
 * Describe how the edited face's surface crossings differ from the source
 * neutral: pairs that newly cross and pairs whose crossing triangle count
 * grew, each as `<part> x <other> <triangles>/<otherTriangles>`, followed by
 * the neutral's pair count. Counts do not measure penetration depth or
 * anatomical validity, and the text says so.
 *
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Reports crossing changes relative to the neutral without claiming depth or validity.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Reports how the edited face's crossings differ from the source neutral.
 */
export function describeConnectedFaceContacts(
  before: readonly IAutoMovieModelCrossing[],
  after: readonly IAutoMovieModelCrossing[],
): string {
  const label = (crossing: IAutoMovieModelCrossing): string => `${crossing.part} x ${crossing.other}`;
  const was = new Map(before.map((entry) => [label(entry), entry]));
  const fresh = after.filter((entry) => !was.has(label(entry)));
  const increased = after.filter((entry) => {
    const earlier = was.get(label(entry));
    return earlier !== undefined &&
      entry.triangles + entry.otherTriangles > earlier.triangles + earlier.otherTriangles;
  });
  const line = (entry: IAutoMovieModelCrossing): string =>
    `${label(entry)} ${entry.triangles}/${entry.otherTriangles}`;
  const reference = `Source neutral: ${before.length} intersecting pairs. Counts do not measure penetration depth or anatomical validity.`;
  if (fresh.length === 0 && increased.length === 0)
    return `No new intersecting pairs or increased triangle counts relative to the source neutral. ${reference}`;
  return [
    fresh.length === 0 ? null : `New intersecting pairs: ${fresh.map(line).join(", ")}`,
    increased.length === 0 ? null : `Increased triangle counts: ${increased.map(line).join(", ")}`,
    reference,
  ].filter((part) => part !== null).join("\n");
}
