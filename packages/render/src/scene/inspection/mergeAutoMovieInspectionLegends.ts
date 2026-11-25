import type { IAutoMovieInspectionLegendEntry } from "@automovie/interface";

/**
 * Join legends into one, adding the counts of entries that share a label and
 * keeping the order in which labels first appear.
 *
 * Entries that share a label and differ in colour throw, because one label then
 * names two different marks.
 */
export function mergeAutoMovieInspectionLegends(
  legends: readonly (readonly IAutoMovieInspectionLegendEntry[])[],
): IAutoMovieInspectionLegendEntry[] {
  const merged: Map<string, IAutoMovieInspectionLegendEntry> = new Map<
    string,
    IAutoMovieInspectionLegendEntry
  >();
  for (const legend of legends)
    for (const entry of legend) {
      const known: IAutoMovieInspectionLegendEntry | undefined = merged.get(
        entry.label,
      );
      if (known === undefined) merged.set(entry.label, { ...entry });
      else if (known.color !== entry.color)
        throw new Error(
          `Legend label "${entry.label}" is given two colours, ${known.color.toString(16)} and ${entry.color.toString(16)}`,
        );
      else known.count += entry.count;
    }
  return [...merged.values()];
}
