import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import type { IAutoMovieArtifactStore } from "../../../../packages/engine/src/cache/IAutoMovieArtifactStore";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { resolveAutoMovieHumanCalibration } from "../../../../packages/human/src/generation/resolveAutoMovieHumanCalibration";
import { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../internal/HumanPeople";

/**
 * A stored Human calibration prepares the same skeleton as a fresh one.
 *
 * Scenarios:
 * 1. The first resolution calibrates and writes one entry; the second reads it without writing.
 * 2. A skeleton prepared from the stored calibration evaluates its neutral pose deeply and strictly equal to one prepared without it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the real calibration cache over a Map store and the real skeleton preparation, comparing full neutral outputs with Node's isDeepStrictEqual (which distinguishes -0); a lossy encoding, a stale key or an unread entry fails.
 * @evidence contracts/development/testing.md#independent-expectations The oracle is the unchanged preparation path that calibrates internally, so the cached path must reproduce it exactly.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers miss and hit for one table person; toolchain invalidation, key composition, verification and encoding edge cases belong to the generic cache tests, which need no calibration.
 * @evidence contracts/development/testing.md#execution-ownership Calls Human generation in-process with an in-memory store; no file, browser or process runs. It costs the person's calibration, seconds rather than milliseconds. Discovered by the test runner from its exported name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and the property each pins.
 */
export async function test_cache_human_calibration(): Promise<void> {
  const params: IAutoMovieHumanParameters = HumanPeople.params(
    HumanPeople.names()[0]!,
  );
  const entries: Map<string, IAutoMovieArtifactStore.IEntry> = new Map();
  let writes: number = 0;
  const store: IAutoMovieArtifactStore = {
    read: async (
      key: string,
    ): Promise<IAutoMovieArtifactStore.IEntry | undefined> =>
      entries.get(key),
    write: async (
      key: string,
      entry: IAutoMovieArtifactStore.IEntry,
    ): Promise<void> => {
      ++writes;
      entries.set(key, entry);
    },
    remove: async (key: string): Promise<void> => {
      entries.delete(key);
    },
    digest: async (bytes: Uint8Array): Promise<string> =>
      `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
  };
  const toolchain: Record<string, string> = { "@automovie/human#src": "a" };

  await resolveAutoMovieHumanCalibration(params, { store, toolchain });
  const stored: IAutoMovieHumanBodyCalibration =
    await resolveAutoMovieHumanCalibration(params, { store, toolchain });
  TestValidator.equals("one write", writes, 1);
  TestValidator.predicate(
    "same skeleton",
    isDeepStrictEqual(
      AutoMovieHumanSkeleton.prepare(params, { calibration: stored })({}),
      AutoMovieHumanSkeleton.prepare(params)({}),
    ),
  );
}
