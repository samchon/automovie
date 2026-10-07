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
 * Unsafe member reads cannot be downgraded into a repairable digest mismatch.
 *
 * Scenarios:
 * 1. An Error from the fenced reader retains its cause and exact member address.
 * 2. A non-Error refusal uses the unsafe-member diagnostic and skips tampering.
 * 3. Both cases remain errors in repairing builds and read-only lint alike.
 */
export const test_production_generated_ownership_unsafe = (): void => {
  const expected: IAutoMovieGeneratedManifest = {
    version: 1,
    builder: { packageVersion: "unit", protocolVersion: "1" },
    inputFingerprint: digest(new Uint8Array([5])),
    files: [
      {
        path: "models/ship.json",
        owner: "builder",
        digest: digest(new Uint8Array([17])),
        sourceTargets: ["model:ship"],
      },
    ],
  };
  const failures: readonly unknown[] = [
    new Error("The owned member is a link outside the root."),
    "unavailable",
  ];
  for (const repairDeclaredFiles of [false, true])
    for (const failure of failures) {
      const world = createGeneratedOwnershipReader({
        manifest: expected,
        files: [],
        read: () => {
          throw failure;
        },
      });
      TestValidator.equals(
        "unsafe reads preserve their diagnostic and cannot repair",
        inspectAutoMovieGeneratedOwnership({
          ...world,
          expected,
          repairDeclaredFiles,
        }),
        [
          {
            code: "generated-path-outside",
            category: "error",
            phase: "compile",
            target: "models/ship.json",
            path: "generated/harbor/models/ship.json",
            message:
              failure instanceof Error
                ? failure.message
                : 'Generated file "models/ship.json" is unsafe. Remove the link before running the builder.',
          },
        ],
      );
    }
};
