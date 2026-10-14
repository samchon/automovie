import type {
  IAutoMovieGeneratedManifest,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import { createGeneratedOwnershipReader } from "../internal/createGeneratedOwnershipReader";

import { inspectAutoMovieGeneratedOwnership } from "../../../../packages/production/src/production/inspectAutoMovieGeneratedOwnership";

function digest(bytes: Uint8Array): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

/**
 * Current owned bytes and exact manifests pass both lint and repairing build.
 *
 * Scenarios:
 * 1. One owned member is read and passes with identical content identities.
 * 2. An empty exact manifest passes without reading any member.
 * 3. Object member ordering does not alter canonical manifest identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes ownership inspection for exact current bytes/manifests and asserts no findings and exact read populations, catching false stale/tampered classifications while allowing canonical object-key reordering.
 * @evidence contracts/testing.md#independent-expectations Native node:crypto hashes explicit byte literals independently of the production helper; exact ownership metadata and current bytes establish the clean result without snapshots of the implementation.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty and singleton inventories, canonical property reordering and repair versus lint modes; byte mismatch, missing/retired/unowned and unsafe cases belong to the companion tests.
 * @evidence contracts/testing.md#execution-ownership The exported portable function calls the directly imported ownership policy with the existing declared in-memory reader helper and starts no process/browser or native artifact.
 */
export function test_production_generated_ownership_current(): void {
  const bytes: Uint8Array = new Uint8Array([17, 23, 41]);
  const expected: IAutoMovieGeneratedManifest = {
    version: 1,
    builder: { packageVersion: "unit", protocolVersion: "1" },
    inputFingerprint: digest(new Uint8Array([5])),
    files: [
      {
        path: "models/ship.json",
        owner: "builder",
        digest: digest(bytes),
        sourceTargets: ["model:ship"],
      },
    ],
  };
  for (const repairDeclaredFiles of [false, true]) {
    const world: ReturnType<typeof createGeneratedOwnershipReader> = createGeneratedOwnershipReader({
      manifest: {
        files: expected.files,
        inputFingerprint: expected.inputFingerprint,
        builder: expected.builder,
        version: 1,
      },
      files: ["models/ship.json"],
      read: (): Uint8Array => bytes,
    });
    TestValidator.equals(
      "exact owned result passes",
      inspectAutoMovieGeneratedOwnership({
        ...world,
        expected,
        repairDeclaredFiles,
      }),
      [],
    );
    TestValidator.equals("expected member is checked once", world.reads, [
      "models/ship.json",
    ]);
    const empty: IAutoMovieGeneratedManifest = { ...expected, files: [] };
    const boundary: ReturnType<typeof createGeneratedOwnershipReader> = createGeneratedOwnershipReader({
      manifest: empty,
      files: [],
      read: (): Uint8Array => bytes,
    });
    TestValidator.equals(
      "empty owned result passes",
      inspectAutoMovieGeneratedOwnership({
        ...boundary,
        expected: empty,
        repairDeclaredFiles,
      }),
      [],
    );
    TestValidator.equals("empty result reads no bytes", boundary.reads, []);
  }
}
