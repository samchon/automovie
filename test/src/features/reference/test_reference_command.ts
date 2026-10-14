import {
  createAutoMovieReferenceProvider,
  runAutoMovieReferenceCommand,
} from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieReferenceReader } from "../../../../packages/mcp/src/structures/IAutoMovieReferenceReader";

import { referenceErrors } from "../internal/referenceErrors";

/**
 * The local command delivers the same provider result with a result-only stdout.
 *
 * Scenarios:
 * 1. An explicit root and request return the provider's exact JSON envelope.
 * 2. Malformed argv, JSON, binding and request inputs route errors without source leaks.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual local command through injected reader/stdout/stderr ports, checking exit status, exact bound root, one newline-delimited provider result and success diagnostic silence. Invalid argv never binds, malformed JSON/request return classified envelopes, and binding failures produce no additional result or private-path diagnostic.
 * @evidence contracts/testing.md#independent-expectations Literal exit codes, output counts, root and INVALID_JSON/INVALID_REQUEST categories define transport behavior independently. Comparing output to a separately invoked shared provider checks transport parity only, not independent parser correctness; the original private-path substring checks prove only those arranged secrets are absent.
 * @evidence contracts/testing.md#distinguishing-cases Preserves valid section dispatch, four invalid argument arrangements, malformed secret-bearing JSON, invalid schema, ordinary binding Error and classified ReferenceError. It checks combined output/root populations; physical root admission and SDK/stdio protocol behavior belong to reader/registration tests.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_command owns two portable groups and all array-backed output observations. The command receives injected capabilities and launches no CLI process, native reader, MCP server, browser or renderer; imported referenceErrors supplies the actual classification constructor rather than a replacement class.
 */
export async function test_reference_command(): Promise<void> {
  const output: string[] = [];
  const diagnostics: string[] = [];
  const roots: string[] = [];
  const reader: IAutoMovieReferenceReader = {
    read: async (): Promise<Uint8Array> => Buffer.from("## A {#a}\nbody"),
    list: async (): Promise<readonly string[]> => [],
  };
  const runtime: NonNullable<Parameters<typeof runAutoMovieReferenceCommand>[1]> = {
    reader: async (root: string): Promise<IAutoMovieReferenceReader> => {
      roots.push(root);
      return reader;
    },
    stdout: (value: string): void => {
      output.push(value);
    },
    stderr: (value: string): void => {
      diagnostics.push(value);
    },
  };
  const input: { operation: "read_section_without_annotations"; location: string } = {
    operation: "read_section_without_annotations",
    location: "docs/settings/a.md#a",
  };
  const code: number = await runAutoMovieReferenceCommand(
    ["--root", "/production", "--request", JSON.stringify(input)],
    runtime,
  );
  TestValidator.equals("success status", code, 0);
  TestValidator.equals("explicit root", roots, ["/production"]);
  TestValidator.equals(
    "same provider result",
    output[0],
    `${JSON.stringify(await createAutoMovieReferenceProvider(reader)(input))}\n`,
  );
  TestValidator.equals("no success diagnostic", diagnostics, []);
  for (const argv of [
    [],
    ["--root", "/production"],
    ["--other", "/production", "--request", "{}"],
    ["--root", "/production", "--other", "{}"],
  ]) {
    TestValidator.equals(
      "usage status",
      await runAutoMovieReferenceCommand(argv, runtime),
      1,
    );
  }
  TestValidator.equals("invalid argv never binds", roots.length, 1);
  TestValidator.equals(
    "malformed JSON status",
    await runAutoMovieReferenceCommand(
      ["--root", "/production", "--request", "secret-not-json"],
      runtime,
    ),
    1,
  );
  TestValidator.equals(
    "malformed JSON is one result",
    JSON.parse(output[1]).error.code,
    "INVALID_JSON",
  );
  TestValidator.predicate(
    "input not reflected",
    !output.join("").includes("secret-not-json"),
  );
  TestValidator.equals(
    "invalid request status",
    await runAutoMovieReferenceCommand(
      ["--root", "/production", "--request", "{}"],
      runtime,
    ),
    1,
  );
  TestValidator.equals(
    "invalid request provider result",
    JSON.parse(output[2]).error.code,
    "INVALID_REQUEST",
  );
  for (const error of [
    new Error("private path"),
    new referenceErrors.ReferenceError("PERMISSION_DENIED", "Read denied."),
  ]) {
    const status: number = await runAutoMovieReferenceCommand(
      ["--root", "/production", "--request", "{}"],
      {
        ...runtime,
        reader: async (): Promise<IAutoMovieReferenceReader> => {
          throw error;
        },
      },
    );
    TestValidator.equals("binding failure status", status, 1);
  }
  TestValidator.predicate(
    "startup failure sanitized",
    !diagnostics.join("").includes("private path"),
  );
  TestValidator.equals("startup failure produces no result", output.length, 3);
}
