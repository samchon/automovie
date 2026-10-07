import type { IAutoMovieGeneratedManifest } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createGeneratedPublicationReader } from "../internal/createGeneratedPublicationReader";
import { loadSourceModule } from "../internal/loadSourceModule";

const { planAutoMovieGeneratedPublication } = loadSourceModule<{
  planAutoMovieGeneratedPublication(
    props: ReturnType<typeof createGeneratedPublicationReader>,
  ): Array<{ path: string; content: Uint8Array | string | null }>;
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/planAutoMovieGeneratedPublication.ts",
  ),
);

/**
 * Identical generation observations produce no candidate writes.
 *
 * Scenarios:
 * 1. One retained member and exact manifest yield an empty plan after a fresh
 *    member read and final manifest observation.
 * 2. An empty member population with an identical manifest is also a no-op.
 * 3. Candidate and resident byte views with different offsets compare their
 *    own bytes rather than their backing buffers.
 */
export const test_production_generated_publication_current = (): void => {
  const serializedManifest = "an exact admitted manifest\n";
  const previous: IAutoMovieGeneratedManifest = {
    version: 1,
    builder: { packageVersion: "unit", protocolVersion: "1" },
    inputFingerprint: "sha256:input",
    files: [
      {
        path: "ship",
        owner: "builder",
        digest: "sha256:ship",
        sourceTargets: ["model:ship"],
      },
    ],
  };
  const candidate = new Uint8Array([9, 17, 23, 41, 8]).subarray(1, 4);
  const resident = new Uint8Array([17, 23, 41, 0]).subarray(0, 3);
  const world = createGeneratedPublicationReader({
    previous,
    files: new Map([["ship", candidate]]),
    resident: new Map([["ship", resident]]),
    serializedManifest,
    manifest: Buffer.from(serializedManifest, "utf8"),
  });
  TestValidator.equals(
    "identical byte views are a no-op",
    planAutoMovieGeneratedPublication(world),
    [],
  );
  TestValidator.equals(
    "each retained member is freshly observed before the manifest",
    world.calls,
    ["resolve:ship", "exists:generated:ship", "read:ship", "manifest"],
  );
  const empty = createGeneratedPublicationReader({
    previous: { ...previous, files: [] },
    files: new Map(),
    resident: new Map(),
    serializedManifest,
    manifest: Buffer.from(serializedManifest, "utf8"),
  });
  TestValidator.equals(
    "empty identical generation is a no-op",
    planAutoMovieGeneratedPublication(empty),
    [],
  );
  TestValidator.equals(
    "empty generation still observes its ownership record",
    empty.calls,
    ["manifest"],
  );
};
