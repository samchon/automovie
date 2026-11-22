import type { IScenarioShard } from "./IScenarioShard";

/**
 * Admit one `--shard=<index>/<count>` argument: both are decimal integers, `count` at least 1 and `index` in [0, count). Any other spelling is refused before discovery, so a mistyped shard never silently runs the whole suite or nothing.
 *
 * @param argument The raw command-line argument.
 * @returns The admitted slice.
 * @throws {Error} When the argument is not a well-formed shard.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The workspace scenario selection question asserts the admitted slice for valid forms and the refusal for each malformed form, catching a shard that silently widens or empties the run.
 * @evidence contracts/development/testing.md#independent-expectations Literal argument strings and their expected index and count are the oracle; nothing derives the expectation from this parser.
 * @evidence contracts/development/testing.md#distinguishing-cases The question covers a valid slice, the first and last slice, a zero count, an index equal to the count, a negative or fractional value and a missing value.
 * @evidence contracts/development/testing.md#execution-ownership This pure synchronous helper is called by the argv parser before discovery and by its workspace question; it allocates one record and reads no environment.
 */
export function parseScenarioShard(argument: string): IScenarioShard {
  const match: RegExpExecArray | null = /^--shard=(\d+)\/(\d+)$/u.exec(
    argument,
  );
  if (match === null)
    throw new Error(
      `--shard requires <index>/<count>, not ${JSON.stringify(argument)}.`,
    );
  const index: number = Number(match[1]);
  const count: number = Number(match[2]);
  if (count < 1 || index >= count)
    throw new Error(
      `--shard index must lie in [0, count) with count at least 1, not ${index}/${count}.`,
    );
  return { index, count };
}
