import {
  AUTO_MOVIE_CAPTURE_PLAN_KEYS,
  parseAutoMovieCapturePlanRequest,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import {
  AUTOMOVIE_CAPTURE_OPTIONS,
  AUTOMOVIE_INSPECT_OPTIONS,
  AUTOMOVIE_RENDER_OPTIONS,
  AUTOMOVIE_REVIEW_OPTIONS,
  readAutoMovieCaptureHostOptions,
} from "automovie";
import fs from "node:fs";
import path from "node:path";

/** The render package's README, whose "Request keys" table maps every key to the requirement it serves. */
const README: string = path.resolve(
  __dirname,
  "../../../../packages/render/README.md",
);

/** One row of the table: its key names, what they ask for and the requirement they serve. */
interface IRow {
  keys: string[];
  asks: string;
  serves: string;
}

/** The rows of a Markdown section's table whose first cell names keys in backticks. */
function rows(markdown: string, heading: string): IRow[] {
  const start: number = markdown.indexOf(`\n## ${heading}\n`);
  if (start === -1) return [];
  const end: number = markdown.indexOf("\n## ", start + 1);
  return markdown
    .slice(start, end === -1 ? undefined : end)
    .split("\n")
    .filter((line: string): boolean => line.startsWith("| `"))
    .map((line: string): IRow => {
      const cells: string[] = line
        .split(/(?<!\\)\|/u)
        .slice(1, -1)
        .map((cell: string): string => cell.trim());
      return {
        keys: [...cells[0]!.matchAll(/`([^`]+)`/gu)].map(
          (match: RegExpMatchArray): string => match[1]!,
        ),
        asks: cells[1] ?? "",
        serves: cells[2] ?? "",
      };
    });
}

/**
 * The render README's one table of request keys and `automovie capture` options matches what the readers accept, in both directions, so the table a reader trusts cannot drift from the grammar.
 *
 * Scenarios:
 *
 * 1. The table's request keys, every key not written with dashes, are exactly `AUTO_MOVIE_CAPTURE_PLAN_KEYS`, which holds the capture's keys and the inspection keys, each listed once.
 * 2. Every request key of the table, given with a value through the command's host reader, is passed on to the request untouched, and the request reader accepts the whole set without refusing a key.
 * 3. The options of the table written with dashes are exactly the union of the options `automovie capture`, `inspect`, `render` and `review` take, `AUTOMOVIE_CAPTURE_OPTIONS`, `AUTOMOVIE_INSPECT_OPTIONS`, `AUTOMOVIE_RENDER_OPTIONS` and `AUTOMOVIE_REVIEW_OPTIONS`, in both directions; every capture option is taken by the capture's host reader for itself and never reaches the request, and no option is a request key.
 * 4. Every row states what its keys ask for and the requirement they serve.
 * 5. The parser finds no table in a section that does not exist, so a renamed heading fails scenario 1 instead of passing on an empty list.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the exported key list, the request reader and the command's host-option reader against the README's table; a key or a command option added to a reader without a row, a row for a key or option no reader takes, or a host option documented as a request key fails. It reads a document, which the checklist counts as repository arrangement; issue #3302 requires the README table and a test that keeps it equal to the readers, and the user's instruction outranks the checklist.
 * @evidence contracts/development/testing.md#independent-expectations The expected sets are the readers' own exported lists, from the readers that refuse what they do not list, and their observed behaviour, not a copy of the table; the table is written by hand for people, so the two are independent sources that must agree.
 * @evidence contracts/development/testing.md#distinguishing-cases Request keys against command options, the four commands' options against the table, a key taken by the capture host against one passed on, and a missing section against a present one. What each key does is owned by the grammar tests under `test/src/features/capture` and the inspection tests; the host options' refusals by the cli tests.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_render_readme_keys`; it reads one file from the checkout and starts no process, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_render_readme_keys(): void {
  const table: IRow[] = rows(fs.readFileSync(README, "utf8"), "Request keys");
  const keys: string[] = table.flatMap((row: IRow): string[] => row.keys);
  const requestKeys: string[] = keys.filter(
    (key: string): boolean => !key.startsWith("--"),
  );
  const hostOptions: string[] = keys
    .filter((key: string): boolean => key.startsWith("--"))
    .map((key: string): string => key.slice(2));

  // 1. The request keys, both directions.
  const sort: (list: readonly string[]) => string[] = (
    list: readonly string[],
  ): string[] =>
    [...list].sort((a: string, b: string): number =>
      a < b ? -1 : a > b ? 1 : 0,
    );
  TestValidator.equals(
    "the table lists every request key and no other",
    sort(requestKeys),
    sort(AUTO_MOVIE_CAPTURE_PLAN_KEYS),
  );
  TestValidator.equals(
    "each key has one row",
    new Set(keys).size,
    keys.length,
  );

  // 2. Request keys pass through the host to the request reader.
  const passed: ReturnType<typeof readAutoMovieCaptureHostOptions> =
    readAutoMovieCaptureHostOptions(
      new Map<string, string>([
        ["module", "subjects.ts"],
        ...requestKeys.map((key: string): [string, string] => [key, ""]),
      ]),
    );
  TestValidator.equals(
    "the host passes every request key on",
    sort([...passed.request.keys()]),
    sort(requestKeys),
  );
  TestValidator.predicate(
    "the request reader knows every key",
    [...passed.request.keys()].every((key: string): boolean => {
      try {
        parseAutoMovieCapturePlanRequest(new Map([[key, "1"]]));
        return true;
      } catch (error) {
        return !(error instanceof Error && error.message.includes(`key "${key}"`));
      }
    }),
  );

  // 3. Command options: the union of every command's own, both directions; the capture's stay with its host.
  TestValidator.equals(
    "the table lists every command option and no other",
    sort(hostOptions),
    sort([
      ...new Set<string>([
        ...AUTOMOVIE_CAPTURE_OPTIONS,
        ...AUTOMOVIE_INSPECT_OPTIONS,
        ...AUTOMOVIE_RENDER_OPTIONS,
        ...AUTOMOVIE_REVIEW_OPTIONS,
      ]),
    ]),
  );
  for (const option of hostOptions)
    TestValidator.predicate(
      `--${option} is not a request key`,
      !AUTO_MOVIE_CAPTURE_PLAN_KEYS.includes(option),
    );
  for (const option of AUTOMOVIE_CAPTURE_OPTIONS) {
    const values: Map<string, string> = new Map(
      option === "file" ? [] : [["module", "subjects.ts"]],
    );
    values.set(option, option === "backend" ? "gpu" : `${option}.value`);
    TestValidator.equals(
      `--${option} is the capture host's own`,
      [...readAutoMovieCaptureHostOptions(values).request.keys()],
      [],
    );
  }

  // 4. Every row says what it asks for and what it serves.
  for (const row of table)
    TestValidator.predicate(
      `${row.keys.join(", ")} states what it asks and serves`,
      row.asks !== "" && row.serves !== "",
    );

  // 5. A missing section yields no rows.
  TestValidator.equals(
    "a missing section has no table",
    rows("# t\n\n## Other\n\n| `x` | a | b |\n", "Request keys"),
    [],
  );
}
