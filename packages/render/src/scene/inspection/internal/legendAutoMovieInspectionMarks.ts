import type {
  IAutoMovieInspectionKindStyle,
  IAutoMovieInspectionLegendEntry,
  IAutoMovieMark,
} from "@automovie/interface";

import { AUTO_MOVIE_INSPECTION_PALETTE } from "../AUTO_MOVIE_INSPECTION_PALETTE.js";

/**
 * List what the colours of a picture's marks mean: each drawn kind once, with
 * the number of its marks drawn in its colour, and for each kind with flagged
 * marks one entry in the flag colour, labelled `<label> (flagged)`, with their
 * number.
 *
 * Entries come in the order kinds first appear among the marks, a kind's own
 * entry before its flag entry. A kind whose every mark is flagged has only its
 * flag entry, because its own colour is not in the picture.
 */
export function legendAutoMovieInspectionMarks(
  marks: readonly IAutoMovieMark[],
  kinds: ReadonlyMap<string, IAutoMovieInspectionKindStyle>,
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
