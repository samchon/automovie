import type { IAutoMovieMark } from "@automovie/engine";

import { AUTO_MOVIE_INSPECTION_PALETTE } from "./AUTO_MOVIE_INSPECTION_PALETTE.js";
import type { IAutoMovieInspectionLegendEntry } from "./IAutoMovieInspectionLegendEntry.js";

/**
 * List what the colours of a picture's marks mean: each drawn kind once, with the number of its marks drawn in its colour, and for each kind with flagged marks one entry in the flag colour, labelled `<label> (flagged)`, with their number.
 *
 * Entries come in the order kinds first appear among the marks, a kind's own entry before its flag entry. A kind whose every mark is flagged has only its flag entry, because its own colour is not in the picture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is listed and counted, the label of a flag entry, the order and the kind that has no own entry.
 * @evidence contracts/development/implementation.md#principled-implementation The legend reports the colours drawn: a flagged mark is drawn in the flag colour, so it is counted there under its kind's name, which keeps one flag colour and still says what was flagged.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass counting per kind, then one pass writing entries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A count of zero gives no entry, so an absent finding never reads as a mark.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the marks.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one picture's marks.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh entries and keeps nothing.
 */
export function legendAutoMovieInspectionMarks(
  marks: readonly IAutoMovieMark[],
  kinds: ReadonlyMap<string, { label: string; color: number }>,
): IAutoMovieInspectionLegendEntry[] {
  const counts: Map<string, { plain: number; flagged: number }> = new Map<
    string,
    { plain: number; flagged: number }
  >();
  for (const mark of marks) {
    let count: { plain: number; flagged: number } | undefined = counts.get(
      mark.kind,
    );
    if (count === undefined) {
      count = { plain: 0, flagged: 0 };
      counts.set(mark.kind, count);
    }
    if (mark.flagged) count.flagged++;
    else count.plain++;
  }

  const legend: IAutoMovieInspectionLegendEntry[] = [];
  for (const [kind, count] of counts) {
    const entry: { label: string; color: number } = kinds.get(kind)!;
    if (count.plain !== 0)
      legend.push({
        label: entry.label,
        color: entry.color,
        count: count.plain,
      });
    if (count.flagged !== 0)
      legend.push({
        label: `${entry.label} (flagged)`,
        color: AUTO_MOVIE_INSPECTION_PALETTE.flagged,
        count: count.flagged,
      });
  }
  return legend;
}
