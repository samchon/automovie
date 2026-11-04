import {
  type IAutoMovieScaffoldSourceEntry,
  renderScaffoldEntries,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

/**
 * Copy nested unit-program sources through the scaffold's portable text renderer.
 *
 * Scenarios:
 * 1. Runner, feature, source and compiler configurations retain their paths and contents,
 *    with only declared token expansion and CRLF-to-LF normalization.
 * 2. Input order leaves the output map unchanged; collisions and unknown tokens
 *    refuse the entire rendering operation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls renderScaffoldEntries with in-memory runner, nested feature, runtime source and compiler configuration entries and asserts the complete rendered map, catching lost nested paths, changed source bytes beyond supported normalization or accidental token retention. File copying is the explicitly requested behavior; this does not assert source arrangement as a proxy for runtime correctness.
 * @evidence contracts/testing.md#independent-expectations Literal source strings and a separately written expected POSIX-keyed map specify permitted token and newline transformations; sorted own entries compare path/content behavior independently of the expected object's prototype, and a separate assertion pins the documented null-prototype result. Actual installed runner execution belongs to its feature units and separate command verification.
 * @evidence contracts/testing.md#distinguishing-cases Five entries cover root configurations, runner, nested feature and production source copying, unchanged import text and Unicode text; reversed inputs, a colliding path and an unknown placeholder cover deterministic output and refusal. Broader template parser and filesystem publication cases remain with their existing tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_template_unit_test_sources entry invokes the real pure renderer in-process with supplied text and keeps all results in memory; it installs no consumer and starts no subprocess, network, browser, native build or media pipeline.
 */
export function test_template_unit_test_sources(): void {
  const entries: IAutoMovieScaffoldSourceEntry[] = [
    {
      relative: path.join("test", "index.ts"),
      content:
        'import { DynamicExecutor } from "@nestia/e2e";\r\nconst title = "{{name}}";\r\n',
    },
    {
      relative: path.join("test", "features", "clock", "test_clock.ts"),
      content:
        'import { clamp } from "../../../src/clamp";\r\nexport function test_clock(): void {}\r\n',
    },
    {
      relative: path.join("src", "clamp.ts"),
      content:
        "/** Closed interval [0, duration]; Δ is caller-owned. */\nexport const clamp = Math.min;\n",
    },
    {
      relative: "tsconfig.json",
      content: '{ "compilerOptions": { "strict": true } }\r\n',
    },
    {
      relative: "tsconfig.test.json",
      content: '{ "extends": "./tsconfig.json", "include": ["test"] }\r\n',
    },
  ];
  const expected: Record<string, string> = {
    "test/index.ts":
      'import { DynamicExecutor } from "@nestia/e2e";\nconst title = "unit-film";\n',
    "test/features/clock/test_clock.ts":
      'import { clamp } from "../../../src/clamp";\nexport function test_clock(): void {}\n',
    "src/clamp.ts":
      "/** Closed interval [0, duration]; Δ is caller-owned. */\nexport const clamp = Math.min;\n",
    "tsconfig.json": '{ "compilerOptions": { "strict": true } }\n',
    "tsconfig.test.json":
      '{ "extends": "./tsconfig.json", "include": ["test"] }\n',
  };
  const variables: Readonly<Record<string, string>> = { name: "unit-film" };
  const expectedEntries: [string, string][] = Object.entries(expected).sort(
    ([left]: [string, string], [right]: [string, string]): number =>
      left < right ? -1 : left > right ? 1 : 0,
  );
  for (const sources of [entries, [...entries].reverse()]) {
    const actual: Record<string, string> = renderScaffoldEntries(
      sources,
      variables,
    );
    TestValidator.predicate(
      "prototype-safe source map",
      Object.getPrototypeOf(actual) === null,
    );
    TestValidator.equals(
      "nested source paths and bytes independent of input order",
      Object.entries(actual).sort(
        ([left]: [string, string], [right]: [string, string]): number =>
          left < right ? -1 : left > right ? 1 : 0,
      ),
      expectedEntries,
    );
  }
  TestValidator.error(
    "duplicate output path",
    (): Record<string, string> =>
      renderScaffoldEntries(
        [...entries, { ...entries[0]!, content: "different" }],
        variables,
      ),
  );
  TestValidator.error(
    "unknown source token",
    (): Record<string, string> =>
      renderScaffoldEntries(
        [{ relative: "test/index.ts", content: "{{unknown}}" }],
        variables,
      ),
  );
}
