import type { IAutoMovieViolationCollector } from "@automovie/interface";

/*
 * Append duplicate faults while scanning typed value/path pairs with one local
 * set.
 */
export function validateUniqueValues(
  entries: ReadonlyArray<readonly [string, string]>,
  label: string,
  collector: IAutoMovieViolationCollector,
): void {
  const seen: Set<string> = new Set<string>();
  for (const [value, entryPath] of entries) {
    if (seen.has(value))
      collector.push(
        "type",
        entryPath,
        `${label} "${value}" must be unique within the model`,
        value,
      );
    seen.add(value);
  }
}
