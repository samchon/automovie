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
 * Unsafe member reads cannot be downgraded into a repairable digest mismatch.
 *
 * Scenarios:
 * 1. An Error from the fenced reader retains its cause and exact member address.
 * 2. A non-Error refusal uses the unsafe-member diagnostic and skips tampering.
 * 3. Both cases remain errors in repairing builds and read-only lint alike.
 * 4. A foreign failure containing missing-file words remains unsafe.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the actual ownership policy with reader failures and asserts exact generated-path-outside findings in both repair and lint modes, catching failure messages downgraded into repairable missing bytes.
 * @evidence contracts/testing.md#independent-expectations Only the project's dedicated missing identity proves absence; unrelated Error and non-Error values cannot authorize repairs. Literal member addresses and original Error text determine the expected diagnostic.
 * @evidence contracts/testing.md#distinguishing-cases Covers ordinary Error, deceptive does-not-exist Error and non-Error failure across both severity modes while excluding tampered-output findings; refusal tests own typed absence and byte changes.
 * @evidence contracts/testing.md#execution-ownership The exported portable unit directly imports the ownership owner and supplies its declared reader/listing capability through the existing fixture helper, starting no host/native artifact or dynamically registered cases.
 */
export function test_production_generated_ownership_unsafe(): void {
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
    new Error("Parent identity does not exist; observation is unsafe."),
    "unavailable",
  ];
  for (const repairDeclaredFiles of [false, true])
    for (const failure of failures) {
      const world: ReturnType<typeof createGeneratedOwnershipReader> = createGeneratedOwnershipReader({
        manifest: expected,
        files: [],
        read: (): Uint8Array => {
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
}
