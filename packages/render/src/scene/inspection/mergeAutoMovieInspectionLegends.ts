import type { IAutoMovieInspectionLegendEntry } from "./IAutoMovieInspectionLegendEntry.js";

/**
 * Join legends into one, adding the counts of entries that share a label and keeping the order in which labels first appear.
 *
 * Entries that share a label and differ in colour throw, because one label then names two different marks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the merge key, the order kept and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The label is the meaning of a colour, so entries are summed by label and a second colour under one label is a contradiction, not a variant.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One map from label to the entry being accumulated, read back in insertion order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A colour conflict is refused instead of resolved by keeping the first.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of entries, with one hashed lookup each.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The curve builder, the defect builder and the scene inspection all tally through this one function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result is a fresh list of fresh entries and the inputs are not kept or changed.
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
