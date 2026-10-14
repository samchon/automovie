import type { IScenarioSelection } from "./IScenarioSelection";
import { parseScenarioSelection } from "./parseScenarioSelection";
import { selectScenarioNames } from "./selectScenarioNames";

/**
 * Resolve an admitted request through discovery without importing scenarios, relying on DynamicExecutor's public basename-filter contract. The second pass uses the fixed selected basename Set rather than admitting newly discovered matching names.
 *
 * @evidence contracts/testing.md#behavioral-verification The existing workspace selection entry records false discovery admissions and the returned filter's exact members, catching eager imports, widened execution selection or a swallowed discovery error.
 * @evidence contracts/testing.md#independent-expectations Literal discovery admissions and selected basenames are the oracle; the test supplies its discovery callback rather than proving real DynamicExecutor filesystem import behavior, whose installed implementation is separately traced by review.
 * @evidence contracts/testing.md#distinguishing-cases Existing cases cover invalid argv before discovery, selected and excluded basenames, a later matching basename, empty discovery and exact discovery-error propagation; parser grammar and matching refusals remain owned by their existing cases.
 * @evidence contracts/testing.md#execution-ownership This async portable helper connects main's first discovery pass to its second execution pass and is tested through a supplied callback without a process or host; it retains collected names until selection and only the selected Set in the returned closure, with no shared cache.
 */
export async function prepareScenarioFilter(
  argv: readonly string[],
  discover: (filter: (name: string) => boolean) => Promise<unknown>,
): Promise<(name: string) => boolean> {
  const selection: IScenarioSelection = parseScenarioSelection(argv);
  const names: string[] = [];
  await discover((name: string): boolean => {
    names.push(name);
    return false;
  });
  const selected: Set<string> = selectScenarioNames(selection, names);
  return (name: string): boolean => selected.has(name);
}
