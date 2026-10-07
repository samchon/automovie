import type {
  AutoMovieContentDigest,
  IAutoMovieDiagnostic,
  IAutoMovieGeneratedManifest,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import path from "node:path";

import { createGeneratedOwnershipReader } from "../internal/createGeneratedOwnershipReader";
import { loadSourceModule } from "../internal/loadSourceModule";

const { inspectAutoMovieGeneratedOwnership } = loadSourceModule<{
  inspectAutoMovieGeneratedOwnership(props: {
    project: ReturnType<typeof createGeneratedOwnershipReader>["project"];
    listFiles: (root: string) => string[];
    expected: IAutoMovieGeneratedManifest;
    repairDeclaredFiles: boolean;
  }): IAutoMovieDiagnostic[];
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/inspectAutoMovieGeneratedOwnership.ts",
  ),
);

const digest = (bytes: Uint8Array): AutoMovieContentDigest =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

/**
 * Current owned bytes and exact manifests pass both lint and repairing build.
 *
 * Scenarios:
 * 1. One owned member is read and passes with identical content identities.
 * 2. An empty exact manifest passes without reading any member.
 * 3. Object member ordering does not alter canonical manifest identity.
 */
export const test_production_generated_ownership_current = (): void => {
  const bytes = new Uint8Array([17, 23, 41]);
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
    const world = createGeneratedOwnershipReader({
      manifest: {
        files: expected.files,
        inputFingerprint: expected.inputFingerprint,
        builder: expected.builder,
        version: 1,
      },
      files: ["models/ship.json"],
      read: () => bytes,
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
    const empty = { ...expected, files: [] };
    const boundary = createGeneratedOwnershipReader({
      manifest: empty,
      files: [],
      read: () => bytes,
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
};
