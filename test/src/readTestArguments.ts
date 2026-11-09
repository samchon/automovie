import type { IScenarioSelection } from "./IScenarioSelection";
import { parseScenarioSelection } from "./parseScenarioSelection";

/**
 * Read one optional Human population value while preserving the existing scenario grammar at every option boundary. This pure reader imports no person registry and writes no environment or shared selection state.
 *
 * @evidence contracts/testing.md#behavioral-verification The workspace Human selection question exercises this reader through direct requests, fixture selection and public preflight, catching lost scenario terms or a Human option that silently widens execution.
 * @evidence contracts/testing.md#independent-expectations Literal include/exclude lists and the declared single Human value grammar supply the oracle; this reader does not manufacture expected person names or scenario matches.
 * @evidence contracts/testing.md#distinguishing-cases The owning question covers space/equals values, groups on both sides, duplicate/missing/blank/positional/unknown options and valueless groups. The existing scenario selection question owns the generic grammar and matching cases.
 * @evidence contracts/testing.md#execution-ownership This portable synchronous helper is shared by actual preflight and Human fixture names; its discoverable workspace question needs no process, browser, generated person or environment mutation.
 */
export function readTestArguments(argv: readonly string[]): {
  selection: IScenarioSelection;
  humanPeople?: string;
} {
  const selection: IScenarioSelection = { include: [], exclude: [] };
  let humanPeople: string | undefined;
  let start: number = 0;

  /** A Human option terminates the preceding scenario group; it cannot supply a missing include/exclude term. */
  function append(end: number): void {
    const fragment: IScenarioSelection = parseScenarioSelection(
      argv.slice(start, end),
    );
    selection.include.push(...fragment.include);
    selection.exclude.push(...fragment.exclude);
  }

  for (let index: number = 0; index < argv.length; index++) {
    const argument: string = argv[index]!;
    if (
      argument !== "--human-people" &&
      !argument.startsWith("--human-people=")
    )
      continue;
    append(index);
    if (humanPeople !== undefined)
      throw new Error("--human-people may occur only once.");
    const value: string | undefined =
      argument === "--human-people"
        ? argv[++index]
        : argument.slice("--human-people=".length);
    if (
      value === undefined ||
      value.trim().length === 0 ||
      value.startsWith("-")
    )
      throw new Error(
        "--human-people requires one nonblank person list or extended.",
      );
    humanPeople = value;
    start = index + 1;
  }
  append(argv.length);
  return humanPeople === undefined ? { selection } : { selection, humanPeople };
}
