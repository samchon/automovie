import type { IScenarioSelection } from "./IScenarioSelection";
import type { IScenarioShard } from "./IScenarioShard";

/**
 * Admit argv before discovery: space-separated groups need at least one term per occurrence, equals forms contain one term and repeated groups accumulate in order. One `--shard=<index>/<count>` selects a slice: decimal integers, `count` at least 1 and `index` in [0, count). Unknown options, positional tokens, blank or option-like terms and malformed or repeated shards are refused. The file imports only types, so the esbuild runner can load it directly under Node's TypeScript stripping.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The existing workspace selection entry asserts exact parsed lists and that invalid argv never reaches discovery, catching silent widening to the default full suite.
 * @evidence contracts/development/testing.md#independent-expectations Literal include/exclude lists and the supported option grammar provide expected requests; no filesystem names or parser output manufacture those expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Owning cases retain empty argv, repeated groups, multiple terms, equals forms and valueless/blank/unknown/positional/option-like refusals; name matching and discovery failure belong to the selection/filter helpers.
 * @evidence contracts/development/testing.md#execution-ownership This synchronous portable helper is called before the runner's discovery pass and by the existing selection test; it scans argv and stores admitted terms with no shared cache, process launch or filesystem access.
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

  /** Admit one `--shard=<index>/<count>`; refuse any other spelling, so a mistyped shard never widens or empties the run. */
  function parseScenarioShard(argument: string): IScenarioShard {
    const match: RegExpExecArray | null = /^--shard=(\d+)\/(\d+)$/u.exec(
      argument,
    );
    if (match === null)
      throw new Error(
        `--shard requires <index>/<count>, not ${JSON.stringify(argument)}.`,
      );
    const index: number = Number(match[1]);
    const shards: number = Number(match[2]);
    if (shards < 1 || index >= shards)
      throw new Error(
        `--shard index must lie in [0, count) with count at least 1, not ${index}/${shards}.`,
      );
    return { index, count: shards };
  }

  for (const argument of argv) {
    if (argument.startsWith("--shard")) {
      finishGroup();
      group = undefined;
      if (selection.shard !== undefined)
        throw new Error("--shard may occur only once.");
      selection.shard = parseScenarioShard(argument);
      continue;
    }
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
