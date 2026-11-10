import {
  type IAutoMovieArtifactKey,
  composeAutoMovieArtifactKey,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

/**
 * A stage artifact key covers every declared member and nothing else.
 *
 * Scenarios:
 * 1. The key equals Node's SHA-256 of the documented canonical text.
 * 2. Reordering toolchain or input members keeps the key.
 * 3. Changing the stage, version, any toolchain identity or any input changes the key.
 * 4. Moving a pair between toolchain and inputs, or splitting a value across names, changes the key.
 * 5. Empty records compose a valid key.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls composeAutoMovieArtifactKey and observes its returned key; a key that ignored a member, depended on member order or confused the toolchain with the inputs fails.
 * @evidence contracts/development/testing.md#independent-expectations Scenario 1 hashes the documented canonical JSON with Node's createHash, an implementation independent of the engine's FIPS 180-4 code; the other scenarios follow from the contract that the key is a function of exactly the declared members.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers order changes that must not act, one change per member that must act, cross-record moves and concatenation ambiguity, and empty records. Planning and resolution own their own tests.
 * @evidence contracts/development/testing.md#execution-ownership A millisecond unit over in-memory records; no file, process or browser runs. Discovered by the test runner from its exported name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and the property each pins.
 */
export function test_cache_artifact_key(): void {
  const base: IAutoMovieArtifactKey = {
    stage: "render.viewer-frame",
    version: "1",
    toolchain: { browser: "Chrome/140", render: "0.1.0" },
    inputs: { state: "sha256:abc", time: "0.5" },
  };
  const key: string = composeAutoMovieArtifactKey(base);
  TestValidator.equals(
    "canonical text hash",
    key,
    `sha256:${createHash("sha256")
      .update(
        JSON.stringify([
          "automovie.artifact-key.v1",
          "render.viewer-frame",
          "1",
          [
            ["browser", "Chrome/140"],
            ["render", "0.1.0"],
          ],
          [
            ["state", "sha256:abc"],
            ["time", "0.5"],
          ],
        ]),
      )
      .digest("hex")}`,
  );
  TestValidator.equals(
    "member order",
    composeAutoMovieArtifactKey({
      ...base,
      toolchain: { render: "0.1.0", browser: "Chrome/140" },
      inputs: { time: "0.5", state: "sha256:abc" },
    }),
    key,
  );
  const changed: IAutoMovieArtifactKey[] = [
    { ...base, stage: "render.viewer-still" },
    { ...base, version: "2" },
    { ...base, toolchain: { ...base.toolchain, browser: "Chrome/141" } },
    { ...base, toolchain: { ...base.toolchain, gpu: "ANGLE" } },
    { ...base, inputs: { ...base.inputs, time: "0.5000001" } },
    { ...base, inputs: { ...base.inputs, state: "sha256:abd" } },
    {
      ...base,
      toolchain: { render: "0.1.0" },
      inputs: { ...base.inputs, browser: "Chrome/140" },
    },
    { ...base, inputs: { state: "sha256:abc", time: "0.", t: "5" } },
  ];
  const keys: Set<string> = new Set([
    key,
    ...changed.map(composeAutoMovieArtifactKey),
  ]);
  TestValidator.equals("every change", keys.size, changed.length + 1);
  TestValidator.predicate(
    "empty records",
    /^sha256:[0-9a-f]{64}$/.test(
      composeAutoMovieArtifactKey({
        stage: "s",
        version: "1",
        toolchain: {},
        inputs: {},
      }),
    ),
  );
}
