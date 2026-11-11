import {
  type IAutoMovieArtifactResolution,
  type IAutoMovieArtifactStore,
  resolveAutoMovieArtifact,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

/**
 * Read-or-compute serves only verified entries and audits on request.
 *
 * Scenarios:
 * 1. A missing entry computes once, stores bytes with their digest and reports `computed`.
 * 2. A valid entry is reused without computing.
 * 3. A corrupted entry is removed, recomputed and reported `repaired`.
 * 4. Verification of an equal recomputation reports `verified` and writes nothing.
 * 5. Verification of a different recomputation replaces the entry and reports `mismatched`.
 * 6. A rejected computation stores nothing and propagates its error.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs resolveAutoMovieArtifact over an in-memory store implementing the public port and checks returned bytes, digests, outcomes, computation counts and store contents; serving a corrupt entry, skipping a requested audit, keeping a mismatched entry or storing a failed computation fails.
 * @evidence contracts/development/testing.md#independent-expectations Digests come from Node's createHash, and outcomes follow the documented definitions of each case.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers miss, hit, corruption, equal and different audits and failure. Key composition and planning own their own tests; directory persistence belongs to the Render store.
 * @evidence contracts/development/testing.md#execution-ownership A millisecond unit with a Map-backed store passed through the supported port; no file, browser or process runs. Discovered by the test runner from its exported name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and the property each pins.
 */
export async function test_cache_artifact_resolve(): Promise<void> {
  const entries: Map<string, IAutoMovieArtifactStore.IEntry> = new Map();
  let writes: number = 0;
  const store: IAutoMovieArtifactStore = {
    read: async (
      key: string,
    ): Promise<IAutoMovieArtifactStore.IEntry | undefined> => entries.get(key),
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
    digest: async (bytes: Uint8Array): Promise<string> => sha256(bytes),
  };
  let runs: number = 0;
  const produce: (bytes: number[]) => () => Promise<Uint8Array> =
    (bytes: number[]): (() => Promise<Uint8Array>) =>
    async (): Promise<Uint8Array> => {
      ++runs;
      return Uint8Array.from(bytes);
    };

  const computed: IAutoMovieArtifactResolution = await resolveAutoMovieArtifact(
    store,
    "k",
    produce([1, 2, 3]),
  );
  TestValidator.equals("computed", [computed.outcome, runs], ["computed", 1]);
  TestValidator.equals(
    "stored digest",
    entries.get("k")?.digest,
    sha256(Uint8Array.from([1, 2, 3])),
  );

  const reused: IAutoMovieArtifactResolution = await resolveAutoMovieArtifact(
    store,
    "k",
    produce([9]),
  );
  TestValidator.equals(
    "reused",
    [reused.outcome, Array.from(reused.bytes), runs],
    ["reused", [1, 2, 3], 1],
  );

  entries.set("k", { ...entries.get("k")!, bytes: Uint8Array.from([1, 2]) });
  const repaired: IAutoMovieArtifactResolution = await resolveAutoMovieArtifact(
    store,
    "k",
    produce([1, 2, 3]),
  );
  TestValidator.equals(
    "repaired",
    [repaired.outcome, Array.from(entries.get("k")!.bytes)],
    ["repaired", [1, 2, 3]],
  );

  const before: number = writes;
  const verified: IAutoMovieArtifactResolution = await resolveAutoMovieArtifact(
    store,
    "k",
    produce([1, 2, 3]),
    true,
  );
  TestValidator.equals(
    "verified",
    [verified.outcome, writes],
    ["verified", before],
  );

  const mismatched: IAutoMovieArtifactResolution =
    await resolveAutoMovieArtifact(store, "k", produce([4]), true);
  TestValidator.equals(
    "mismatched",
    [mismatched.outcome, entries.get("k")?.digest],
    ["mismatched", sha256(Uint8Array.from([4]))],
  );

  await TestValidator.error(
    "failure",
    (): Promise<unknown> =>
      resolveAutoMovieArtifact(
        store,
        "failed",
        async (): Promise<Uint8Array> => {
          throw new Error("compute failed");
        },
      ),
  );
  TestValidator.equals("failure stores nothing", entries.has("failed"), false);
}

/** Node's SHA-256 in the store's `sha256:` form. */
const sha256: (bytes: Uint8Array) => string = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
