import { TestValidator } from "@nestia/e2e";

import { composeAutoMovieArtifactKey } from "../../../../packages/engine/src/cache/composeAutoMovieArtifactKey";
import { planAutoMovieArtifacts } from "../../../../packages/engine/src/cache/planAutoMovieArtifacts";
import { composeViewerFrameKeys } from "../../../../packages/template/scaffold/production/src/executable/render/node/cache/composeViewerFrameKeys";

/**
 * Viewer frame keys change exactly when a frame's pixels may change.
 *
 * Scenarios:
 * 1. Each key is the engine artifact key of stage `render.viewer-frame` with the frame time and state digest as inputs.
 * 2. Equal state digests at different times compose different keys (frame purity).
 * 3. An edit changing one frame's state digest re-plans only that frame against the previous run's keys; an unchanged rerun plans no capture.
 * 4. A toolchain change (browser build) or a capture-input change (raster) re-plans every frame.
 * 5. Misaligned digests and scope inputs named `seconds` or `state` refuse.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls composeViewerFrameKeys and feeds its keys to planAutoMovieArtifacts, observing keys and capture actions; a key missing the time, the state, the toolchain or a capture input, or a plan recapturing unchanged frames, fails.
 * @evidence contracts/development/testing.md#independent-expectations Scenario 1's oracle is the documented key record composed through the engine's public key function; the others follow from the contract that a frame is a function of exactly its declared inputs.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers one-frame edits that must act, a rerun that must not, equal states at different times, toolchain and input changes, and malformed inputs. Generic key, plan and resolution semantics are owned by the cache tests; page observation and storage need a real page and directory.
 * @evidence contracts/development/testing.md#execution-ownership A millisecond unit over in-memory keys; no browser, file or process runs. Discovered by the test runner from its exported name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and the property each pins.
 */
export function test_render_frame_cache_keys(): void {
  const scope: Parameters<typeof composeViewerFrameKeys>[0] = {
    toolchain: { browser: "140.0.0.0", graphics: "Google ANGLE" },
    inputs: { url: "http://127.0.0.1:5199/?capture=1", width: "1280" },
  };
  const times: number[] = [0, 1 / 30, 2 / 30, 3 / 30];
  const states: string[] = ["s0", "s1", "s1", "s3"];
  const keys: string[] = composeViewerFrameKeys(scope, times, states);
  TestValidator.equals(
    "engine key record",
    keys[1],
    composeAutoMovieArtifactKey({
      stage: "render.viewer-frame",
      version: "1",
      toolchain: scope.toolchain,
      inputs: { ...scope.inputs, seconds: String(1 / 30), state: "s1" },
    }),
  );
  TestValidator.predicate("purity over time", keys[1] !== keys[2]);

  const edited: string[] = composeViewerFrameKeys(scope, times, [
    "s0",
    "s1",
    "edited",
    "s3",
  ]);
  TestValidator.equals(
    "one edited frame",
    planAutoMovieArtifacts(edited, new Set(keys)).actions,
    ["reuse", "reuse", "compute", "reuse"],
  );
  TestValidator.equals(
    "unchanged rerun",
    planAutoMovieArtifacts(
      composeViewerFrameKeys(scope, times, states),
      new Set(keys),
    ).compute,
    0,
  );
  for (const changed of [
    { ...scope, toolchain: { ...scope.toolchain, browser: "141.0.0.0" } },
    { ...scope, inputs: { ...scope.inputs, width: "1920" } },
  ])
    TestValidator.equals(
      "every frame",
      planAutoMovieArtifacts(
        composeViewerFrameKeys(changed, times, states),
        new Set(keys),
      ).compute,
      times.length,
    );

  TestValidator.error("misaligned", (): string[] =>
    composeViewerFrameKeys(scope, times, ["s0"]),
  );
  for (const name of ["seconds", "state"])
    TestValidator.error(`reserved ${name}`, (): string[] =>
      composeViewerFrameKeys(
        { ...scope, inputs: { ...scope.inputs, [name]: "x" } },
        times,
        states,
      ),
    );
}
