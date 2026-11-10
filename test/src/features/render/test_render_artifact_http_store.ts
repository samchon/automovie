import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import { type Server, createServer } from "node:http";
import type { AddressInfo } from "node:net";

import type { IAutoMovieArtifactStore } from "../../../../packages/engine/src/cache/IAutoMovieArtifactStore";
import { composeAutoMovieArtifactKey } from "../../../../packages/engine/src/cache/composeAutoMovieArtifactKey";
import { resolveAutoMovieArtifact } from "../../../../packages/engine/src/cache/resolveAutoMovieArtifact";
import { createAutoMovieHttpArtifactStore } from "../../../../packages/render/src/cache/createAutoMovieHttpArtifactStore";
import { createAutoMovieArtifactMiddleware } from "../../../../packages/template/scaffold/production/src/executable/render/node/cache/createAutoMovieArtifactMiddleware";

/**
 * A page-side HTTP store and the server middleware carry verified entries.
 *
 * Scenarios:
 * 1. The engine resolver computes once through the HTTP store and reuses the entry the middleware stored.
 * 2. The HTTP store's Web Crypto digest equals Node's SHA-256.
 * 3. An upload whose body does not match its declared digest is refused with 400 and stores nothing.
 * 4. Delete removes the entry; a path outside the key form answers 404 and a malformed key refuses client-side.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the real middleware in an in-process HTTP server on an ephemeral loopback port and the real fetch-based store against it, observing outcomes, digests and statuses; a transport that dropped the digest header, stored a damaged upload or read a failure as a miss fails.
 * @evidence contracts/development/testing.md#independent-expectations Digests are checked against Node's createHash and statuses against the documented HTTP contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers miss, hit, damaged upload, delete, foreign path and malformed key. Directory persistence and resolution semantics are owned by their own tests.
 * @evidence contracts/development/testing.md#execution-ownership Starts only an in-process loopback server owned and closed by this test, backed by a Map store; no browser, viewer or child process runs. Discovered by the test runner from its exported name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and the property each pins.
 */
export async function test_render_artifact_http_store(): Promise<void> {
  const entries: Map<string, IAutoMovieArtifactStore.IEntry> = new Map();
  const backing: IAutoMovieArtifactStore = {
    read: async (
      key: string,
    ): Promise<IAutoMovieArtifactStore.IEntry | undefined> => entries.get(key),
    write: async (
      key: string,
      entry: IAutoMovieArtifactStore.IEntry,
    ): Promise<void> => {
      entries.set(key, entry);
    },
    remove: async (key: string): Promise<void> => {
      entries.delete(key);
    },
    digest: async (bytes: Uint8Array): Promise<string> => sha256(bytes),
  };
  const server: Server = createServer(
    createAutoMovieArtifactMiddleware(backing),
  );
  await new Promise<unknown>((resolve: (value: unknown) => void): void => {
    server.listen(0, "127.0.0.1", (): void => resolve(undefined));
  });
  try {
    const base: string = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const store: IAutoMovieArtifactStore = createAutoMovieHttpArtifactStore(
      `${base}/`,
    );
    const key: string = composeAutoMovieArtifactKey({
      stage: "test",
      version: "1",
      toolchain: {},
      inputs: {},
    });
    const bytes: Uint8Array = Uint8Array.from([5, 6, 7]);
    let runs: number = 0;
    const compute: () => Promise<Uint8Array> =
      async (): Promise<Uint8Array> => {
        ++runs;
        return bytes;
      };
    TestValidator.equals(
      "computed",
      (await resolveAutoMovieArtifact(store, key, compute)).outcome,
      "computed",
    );
    TestValidator.equals(
      "reused",
      [(await resolveAutoMovieArtifact(store, key, compute)).outcome, runs],
      ["reused", 1],
    );
    TestValidator.equals(
      "web crypto digest",
      await store.digest(bytes),
      sha256(bytes),
    );

    const other: string = "0".repeat(64);
    const damaged: Response = await fetch(`${base}/${other}`, {
      method: "PUT",
      headers: { "x-automovie-artifact-digest": sha256(bytes) },
      body: Uint8Array.from([1]),
    });
    TestValidator.equals(
      "damaged upload",
      [damaged.status, entries.has(`sha256:${other}`)],
      [400, false],
    );

    await store.remove(key);
    TestValidator.equals("removed", await store.read(key), undefined);
    TestValidator.equals(
      "foreign path",
      (await fetch(`${base}/elsewhere`)).status,
      404,
    );
    await TestValidator.error(
      "malformed key",
      (): Promise<unknown> => store.read("sha256:xyz"),
    );
  } finally {
    await new Promise<unknown>((resolve: (value: unknown) => void): void => {
      server.close((): void => resolve(undefined));
    });
  }
}

/** Node's SHA-256 in the store's `sha256:` form. */
const sha256: (bytes: Uint8Array) => string = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
