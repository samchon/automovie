import { TestValidator } from "@nestia/e2e";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { IAutoMovieArtifactResolution } from "../../../../packages/engine/src/cache/IAutoMovieArtifactResolution";
import { composeAutoMovieArtifactKey } from "../../../../packages/engine/src/cache/composeAutoMovieArtifactKey";
import { resolveAutoMovieArtifact } from "../../../../packages/engine/src/cache/resolveAutoMovieArtifact";
import type { IAutoMovieDirectoryArtifactStore } from "../../../../packages/template/scaffold/production/src/executable/render/node/cache/IAutoMovieDirectoryArtifactStore";
import { createAutoMovieDirectoryArtifactStore } from "../../../../packages/template/scaffold/production/src/executable/render/node/cache/createAutoMovieDirectoryArtifactStore";

/**
 * The directory store persists verified entries across opens and collects garbage.
 *
 * Scenarios:
 * 1. An entry written through the engine resolver is listed and reused after reopening the directory.
 * 2. A bytes file replaced on disk fails verification and is repaired.
 * 3. collect with a keep set deletes every other entry and abandoned temporary files.
 * 4. collect with maxBytes deletes least recently read entries outside the keep set until the bytes fit.
 * 5. A different layout stamp wipes the entries; malformed keys refuse.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the real store through the engine resolver and its own listing and collection, observing outcomes, listed keys and remaining bytes; a store that served a replaced file, lost entries across opens, kept unreferenced entries or ignored its stamp fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected outcomes follow the documented store and resolver contracts; byte totals are the literal sizes written.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers reopen, corruption, keep-set collection, size-bounded collection with a kept entry, layout invalidation and malformed keys. Resolution semantics over an abstract store belong to the cache tests.
 * @evidence contracts/development/testing.md#execution-ownership Uses a fresh temporary directory owned and removed by this test; no browser, process or network runs. Discovered by the test runner from its exported name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and the property each pins.
 */
export async function test_render_artifact_directory_store(): Promise<void> {
  const directory: string = await mkdtemp(
    path.join(tmpdir(), "automovie-artifact-store-"),
  );
  try {
    const key: (name: string) => string = (name: string): string =>
      composeAutoMovieArtifactKey({
        stage: "test",
        version: "1",
        toolchain: {},
        inputs: { name },
      });
    const bytes: (length: number) => () => Promise<Uint8Array> =
      (length: number): (() => Promise<Uint8Array>) =>
      async (): Promise<Uint8Array> =>
        new Uint8Array(length).fill(length);

    let store: IAutoMovieDirectoryArtifactStore =
      await createAutoMovieDirectoryArtifactStore(directory);
    for (const [name, length] of [
      ["a", 10],
      ["b", 20],
      ["c", 30],
    ] as const)
      await resolveAutoMovieArtifact(store, key(name), bytes(length));
    store = await createAutoMovieDirectoryArtifactStore(directory);
    const listed: Set<string> = await store.keys();
    TestValidator.equals(
      "listed after reopen",
      [
        listed.size,
        ["a", "b", "c"].every((name: string) => listed.has(key(name))),
      ],
      [3, true],
    );
    const reused: IAutoMovieArtifactResolution = await resolveAutoMovieArtifact(
      store,
      key("a"),
      bytes(99),
    );
    TestValidator.equals("reused", reused.outcome, "reused");

    await writeFile(
      path.join(directory, "entries", `${key("b").slice(7)}.bin`),
      new Uint8Array([1]),
    );
    TestValidator.equals(
      "repaired",
      (await resolveAutoMovieArtifact(store, key("b"), bytes(20))).outcome,
      "repaired",
    );

    await writeFile(path.join(directory, "entries", "partial.tmp"), "x");
    TestValidator.equals(
      "keep set",
      await store.collect({ keep: new Set([key("a"), key("b")]) }),
      { removed: 1, bytes: 30 },
    );
    TestValidator.equals(
      "temporary removed",
      (await readdir(path.join(directory, "entries"))).some((name: string) =>
        name.endsWith(".tmp"),
      ),
      false,
    );

    // b was read last, so a is the least recently used candidate.
    await resolveAutoMovieArtifact(store, key("b"), bytes(20));
    await resolveAutoMovieArtifact(store, key("c"), bytes(30));
    TestValidator.equals(
      "size bound",
      await store.collect({ keep: new Set([key("c")]), maxBytes: 50 }),
      { removed: 1, bytes: 50 },
    );
    TestValidator.equals(
      "least recently used removed",
      (await store.keys()).has(key("a")),
      false,
    );

    await writeFile(path.join(directory, "store.json"), '{"format":"old"}');
    store = await createAutoMovieDirectoryArtifactStore(directory);
    TestValidator.equals("layout invalidation", (await store.keys()).size, 0);
    await TestValidator.error(
      "malformed key",
      (): Promise<unknown> => store.read("sha256:xyz"),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
