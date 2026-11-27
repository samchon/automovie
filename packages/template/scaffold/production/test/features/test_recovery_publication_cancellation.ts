import type {
  IAutoMovieFilePublicationOptions,
  IAutoMovieFileReceipt,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { publishRecoveryArtifact } from "../../src/executable/recovery/node/publishRecoveryArtifact";

/**
 * A publication's cancellation predicate is observed before any output is created.
 *
 * Scenarios:
 * 1. True cancels and a thrown predicate fails; both run exactly once and create no output.
 * 2. Nonboolean predicate results fail, while a nonfunction predicate refuses, without output.
 * 3. False permits exact JSON publication and a later cancellation preserves the existing bytes.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The discovered Node integration check uses one temporary directory to observe the real publication boundary. It checks the returned status, callback count, presence of the file and preservation of its bytes, then removes the directory in finally.
 * @evidence contracts/development/testing.md#independent-expectations Literal callbacks and malformed runtime inputs distinguish cancellation, failure and successful publication. The directory exposes any premature write. Parsed JSON verifies the first publication's value, and the captured bytes are the oracle for preserving it on cancellation.
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
        publishRecoveryArtifact(output, artifact, {
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
        publishRecoveryArtifact(output, artifact, options);
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
      publishRecoveryArtifact(
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
      publishRecoveryArtifact(output, artifact, {
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
      publishRecoveryArtifact(
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
