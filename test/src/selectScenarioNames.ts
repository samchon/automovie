import type { IScenarioSelection } from "./IScenarioSelection";

/**
 * Require every requested substring to match a discovered basename, then retain the include/exclude intersection in discovery order and refuse an empty result. Duplicate basenames collapse in the returned Set as before.
 *
 * @evidence contracts/testing.md#behavioral-verification The existing workspace selection entry asserts default, exclude-only and intersected results and unmatched/empty refusals, catching silently ignored request terms or changed substring semantics.
 * @evidence contracts/testing.md#independent-expectations Literal synthetic basenames and explicitly chosen expected members are independent of this filter; filesystem discovery and duplicate-basename ambiguity are not independently proved here.
 * @evidence contracts/testing.md#distinguishing-cases Existing cases cover empty request, multiple names, unmatched include/exclude terms and exclusion of every included match; the filter wrapper separately refuses empty discovery and preserves discovery errors.
 * @evidence contracts/testing.md#execution-ownership This portable synchronous helper is consumed by discovery preparation and its existing workspace test; it rescans names for requested terms and final filtering, allocates the result Set and intermediate filtered array, and owns no cache or host.
 */
export function selectScenarioNames(
  selection: IScenarioSelection,
  names: readonly string[],
): Set<string> {
  for (const key of ["include", "exclude"] as const)
    for (const term of selection[key])
      if (names.some((name: string): boolean => name.includes(term)) === false)
        throw new Error(
          `--${key} term ${JSON.stringify(term)} matched no scenario.`,
        );
  const selected: Set<string> = new Set(
    names.filter(
      (name: string): boolean =>
        (selection.include.length === 0 ||
          selection.include.some((term: string): boolean => name.includes(term))) &&
        selection.exclude.every((term: string): boolean => !name.includes(term)),
    ),
  );
  if (selected.size === 0)
    throw new Error("The scenario selection matched nothing.");
  return selected;
}
