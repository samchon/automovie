import type { IAutoMovieGeneratedManifest } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { planAutoMovieGeneratedPublication } from "../../../../packages/production/src/production/planAutoMovieGeneratedPublication";

import { createGeneratedPublicationReader } from "../internal/createGeneratedPublicationReader";

/**
 * Identical generation observations produce no candidate writes.
 *
 * Scenarios:
 * 1. One retained member and exact manifest yield an empty plan after a fresh
 *    member read and final manifest observation.
 * 2. An empty member population with an identical manifest is also a no-op.
 * 3. Candidate and resident byte views with different offsets compare their
 *    own bytes rather than their backing buffers.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual publication planner for identical member/manifest bytes and an empty member population, asserting no writes plus exact observation order; byte views have different backing offsets to catch whole-buffer comparison.
 * @evidence contracts/testing.md#independent-expectations Both selected views contain the literal sequence17/23/41 despite different surrounding bytes, and the serialized manifest equals resident UTF-8 bytes. Equal content and no retired members require an empty write plan independently of planner output.
 * @evidence contracts/testing.md#distinguishing-cases Singleton and empty candidate populations retain final ownership observation, and distinct byte offsets distinguish view content from backing-buffer content; changes and reader failures belong to companion tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_generated_publication_current runs portable synchronous source policy through the existing typed reader fixture; it launches no consumer, native build or filesystem transaction.
 */
export function test_production_generated_publication_current(): void {
  const serializedManifest: string = "an exact admitted manifest\n";
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
  const candidate: Uint8Array = new Uint8Array([9, 17, 23, 41, 8]).subarray(1, 4);
  const resident: Uint8Array = new Uint8Array([17, 23, 41, 0]).subarray(0, 3);
  const world: ReturnType<typeof createGeneratedPublicationReader> = createGeneratedPublicationReader({
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
  const empty: ReturnType<typeof createGeneratedPublicationReader> = createGeneratedPublicationReader({
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
}
