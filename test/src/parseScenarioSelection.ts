import type { IScenarioSelection } from "./IScenarioSelection";

/**
 * Admit argv before discovery: space-separated groups need at least one term per occurrence, equals forms contain one term and repeated groups accumulate in order. Unknown options, positional tokens and blank or option-like terms retain their existing refusal messages.
 *
 * @evidence contracts/testing.md#behavioral-verification The existing workspace selection entry asserts exact parsed lists and that invalid argv never reaches discovery, catching silent widening to the default full suite.
 * @evidence contracts/testing.md#independent-expectations Literal include/exclude lists and the supported option grammar provide expected requests; no filesystem names or parser output manufacture those expectations.
 * @evidence contracts/testing.md#distinguishing-cases Owning cases retain empty argv, repeated groups, multiple terms, equals forms and valueless/blank/unknown/positional/option-like refusals; name matching and discovery failure belong to the selection/filter helpers.
 * @evidence contracts/testing.md#execution-ownership This synchronous portable helper is called before the runner's discovery pass and by the existing selection test; it scans argv and stores admitted terms with no shared cache, process launch or filesystem access.
 */
export function parseScenarioSelection(
  argv: readonly string[],
): IScenarioSelection {
  const selection: IScenarioSelection = { include: [], exclude: [] };
  let group: "include" | "exclude" | undefined;
  let count: number = 0;

  /** Refuse a completed space-separated option occurrence that collected no term. */
  function finishGroup(): void {
    if (group !== undefined && count === 0)
      throw new Error(`--${group} requires at least one nonblank term.`);
  }

  /** Check one term without normalization, then append it to the matching ordered request list. */
  function append(key: "include" | "exclude", value: string): void {
    if (value.trim().length === 0 || value.startsWith("-"))
      throw new Error(
        `--${key} requires a nonblank term, not ${JSON.stringify(value)}.`,
      );
    selection[key].push(value);
  }

  for (const argument of argv) {
    if (argument.startsWith("-")) {
      finishGroup();
      const option: RegExpExecArray | null =
        /^--(include|exclude)(?:=([\s\S]*))?$/u.exec(argument);
      if (option === null)
        throw new Error(`Unexpected argument ${JSON.stringify(argument)}.`);
      const key: "include" | "exclude" = option[1] as "include" | "exclude";
      if (option[2] !== undefined) {
        append(key, option[2]);
        group = undefined;
      } else {
        group = key;
        count = 0;
      }
    } else {
      if (group === undefined)
        throw new Error(`Unexpected argument ${JSON.stringify(argument)}.`);
      append(group, argument);
      ++count;
    }
  }
  finishGroup();
  return selection;
}
