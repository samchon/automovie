import type { IAutoMovieModelCrossing } from "@automovie/engine";

/**
 * Describe how the edited face's surface crossings differ from the source neutral: pairs that newly cross and pairs whose crossing triangle count grew, each as `<part> x <other> <triangles>/<otherTriangles>`, followed by the neutral's pair count. Counts do not measure penetration depth or anatomical validity, and the text says so. Ordered part identities come from the crossing owner and are compared separately, so delimiter text inside an id cannot alias another pair. Repeated before entries for the same ordered pair retain the last supplied reading, as the existing comparison contract did.
 *
 * @evidence contracts/common.md#principled-implementation A two-level part/other map identifies ordered crossing pairs without display-label delimiter collisions, and a pair is increased only when its summed triangle incidence exceeds the supplied neutral reading.
 * @evidence contracts/common.md#clear-and-simple-design This formatter compares provided numerical reports and produces text; the crossing owner supplies pair ordering and the panel owns source-neutral reading lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Triangle counts are explicitly not depth or anatomical validity, and source neutral data comes from supplied readings rather than a fixture answer or assumed zero crossings.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies new/increased decisions, ordered pair identity, duplicate-reference behavior, report formatting and incidence interpretation limits.
 * @evidence contracts/performance.md#efficient-algorithms Indexing b neutral entries and one a edited-entry scan cost O(b+a) expected map operations; output formatting costs its l characters, with O(b+a+l) index, selected references and strings rather than two full edited filters.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The comparison builds a per-call reference index but retains no cross-document numerical cache; the panel owns neutral reading reuse for its basis.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Temporary maps and selected report references end with the call and only output text escapes, without live handles or running tasks.
 */
export function describeConnectedFaceContacts(
  before: readonly IAutoMovieModelCrossing[],
  after: readonly IAutoMovieModelCrossing[],
): string {
  const label: (crossing: IAutoMovieModelCrossing) => string = (crossing: IAutoMovieModelCrossing): string =>
    `${crossing.part} x ${crossing.other}`;
  const was: Map<string, Map<string, IAutoMovieModelCrossing>> = new Map();
  for (const entry of before) {
    const others: Map<string, IAutoMovieModelCrossing> = was.get(entry.part) ?? new Map();
    others.set(entry.other, entry);
    was.set(entry.part, others);
  }
  const fresh: IAutoMovieModelCrossing[] = [];
  const increased: IAutoMovieModelCrossing[] = [];
  for (const entry of after) {
    const earlier: IAutoMovieModelCrossing | undefined = was.get(entry.part)?.get(entry.other);
    if (earlier === undefined) fresh.push(entry);
    else if (entry.triangles + entry.otherTriangles > earlier.triangles + earlier.otherTriangles) increased.push(entry);
  }
  const line: (entry: IAutoMovieModelCrossing) => string = (entry: IAutoMovieModelCrossing): string =>
    `${label(entry)} ${entry.triangles}/${entry.otherTriangles}`;
  const reference: string = `Source neutral: ${before.length} intersecting pairs. Counts do not measure penetration depth or anatomical validity.`;
  if (fresh.length === 0 && increased.length === 0)
    return `No new intersecting pairs or increased triangle counts relative to the source neutral. ${reference}`;
  return [
    fresh.length === 0
      ? null
      : `New intersecting pairs: ${fresh.map(line).join(", ")}`,
    increased.length === 0
      ? null
      : `Increased triangle counts: ${increased.map(line).join(", ")}`,
    reference,
  ]
    .filter((part: string | null): boolean => part !== null)
    .join("\n");
}
