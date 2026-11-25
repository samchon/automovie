import type {
  IAutoMovieFilePublicationOptions,
  IAutoMovieFileReceipt,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { publishAutoMovieRecoveryArtifact } from "../../src/executable/recovery/node/publishAutoMovieRecoveryArtifact";

/**
 * A publication's cancellation predicate is observed before any output is created.
 *
 * Scenarios:
 * 1. True cancels and a thrown predicate fails; both run exactly once and create no output.
 * 2. Nonboolean predicate results fail, while a nonfunction predicate refuses, without output.
 * 3. False permits exact JSON publication and a later cancellation preserves the existing bytes.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the shipped Node publication host and observes terminal tags, predicate invocation count, filesystem absence and exact surviving JSON bytes. The entry owns one unique temporary directory and removes it in finally; it replaces no foreign method and starts no subprocess, compiler, renderer or timer.
 * @evidence contracts/development/testing.md#independent-expectations Literal predicates and callback errors determine the terminal outcomes; an owned empty directory independently exposes any premature publication. Separates true/false, thrown callback, undefined/null/string/number result, malformed callback and cancellation after an immutable output already exists.
 * @evidence contracts/development/common.md#meaningful-documentation States pre-work cancellation and failure behavior alongside exact output/lifetime checks.
 */
export function test_recovery_publication_cancellation(): void {
  const directory: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-interface-publication-"),
  );
  const output: string = path.join(directory, "artifact.json");
  const artifact: { value: number } = { value: 42 };
  try {
    for (const throws of [false, true]) {
      let calls: number = 0;
      const result: IAutoMovieRecoveryResult<IAutoMovieFileReceipt> =
        publishAutoMovieRecoveryArtifact(output, artifact, {
          cancelled: (): boolean => {
            calls++;
            if (throws) throw new Error("publication predicate failed");
            return true;
          },
        });
      TestValidator.equals(
        "cancellation and exception remain distinct",
        result.status,
        throws ? "failed" : "cancelled",
      );
      TestValidator.equals("one pre-work predicate call", calls, 1);
      TestValidator.predicate(
        "pre-work exit returns no receipt",
        !("value" in result),
      );
      TestValidator.equals(
        "pre-work exit creates no files",
        fs.readdirSync(directory),
        [],
      );
    }
    for (const invalidResult of [undefined, null, "yes", 1]) {
      const options: IAutoMovieFilePublicationOptions = Object.defineProperty(
        {},
        "cancelled",
        { value: (): unknown => invalidResult },
      );
      const result: IAutoMovieRecoveryResult<IAutoMovieFileReceipt> =
        publishAutoMovieRecoveryArtifact(output, artifact, options);
      TestValidator.equals(
        "nonboolean predicate fails",
        result.status,
        "failed",
      );
      TestValidator.equals(
        "invalid result creates no files",
        fs.readdirSync(directory),
        [],
      );
    }
    const invalid: IAutoMovieRecoveryResult<IAutoMovieFileReceipt> =
      publishAutoMovieRecoveryArtifact(
        output,
        artifact,
        JSON.parse('{"cancelled":null}'),
      );
    TestValidator.equals(
      "nonfunction predicate refuses",
      invalid.status,
      "refused",
    );
    TestValidator.equals(
      "refused predicate creates no files",
      fs.readdirSync(directory),
      [],
    );
    const completed: IAutoMovieRecoveryResult<IAutoMovieFileReceipt> =
      publishAutoMovieRecoveryArtifact(output, artifact, {
        cancelled: (): boolean => false,
      });
    TestValidator.equals(
      "false permits publication",
      completed.status,
      "complete",
    );
    const bytes: string = fs.readFileSync(output, "utf8");
    TestValidator.equals(
      "published data preserves the artifact",
      JSON.parse(bytes),
      artifact,
    );
    const cancelled: IAutoMovieRecoveryResult<IAutoMovieFileReceipt> =
      publishAutoMovieRecoveryArtifact(
        output,
        { value: 99 },
        { cancelled: (): boolean => true },
      );
    TestValidator.equals(
      "later cancellation returns no publication",
      cancelled.status,
      "cancelled",
    );
    TestValidator.equals(
      "cancellation preserves published bytes",
      fs.readFileSync(output, "utf8"),
      bytes,
    );
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
}
