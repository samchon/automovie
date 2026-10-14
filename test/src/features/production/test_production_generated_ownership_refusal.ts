import type {
  IAutoMovieDiagnostic,
  IAutoMovieGeneratedManifest,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import { createGeneratedOwnershipReader } from "../internal/createGeneratedOwnershipReader";

import { inspectAutoMovieGeneratedOwnership } from "../../../../packages/production/src/production/inspectAutoMovieGeneratedOwnership";
import { AutoMovieGeneratedFileMissingError } from "../../../../packages/production/src/production/AutoMovieGeneratedFileMissingError";

function digest(bytes: Uint8Array): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

/**
 * Ownership is established by exact bytes rather than a resident pathname.
 *
 * Scenarios:
 * 1. Missing manifests and changed or absent expected bytes refuse lint and
 *    remain repairable warnings for a build.
 * 2. A byte-identical retired member is stale owned output, whereas an edited,
 *    unreadable or undeclared extra always refuses both modes.
 * 3. Input and whole-manifest changes have separate diagnostic identities.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs ownership inspection against absent/changed expected bytes and prior extra entries, asserting exact code/severity populations and address preservation; catches adopting foreign bytes or removing a changed former output as owned.
 * @evidence contracts/testing.md#independent-expectations Native SHA-256 of literal byte arrays defines current/prior identities; only byte equality with the prior manifest authorizes stale retirement, and typed missing observation alone means repairable absence.
 * @evidence contracts/testing.md#distinguishing-cases Covers typed absence, tampered bytes, no manifest, byte-identical/edited/unreadable former output, undeclared bytes, stale input and full-manifest drift in both repair and lint modes; exact clean and unsafe expected reads have separate tests.
 * @evidence contracts/testing.md#execution-ownership This exported portable unit directly imports the policy and uses the existing reader capability helper, with no native build, real host or dynamic case registration.
 */
export function test_production_generated_ownership_refusal(): void {
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
    const category: "warning" | "error" = repairDeclaredFiles ? "warning" : "error";
    for (const read of [
      (): Uint8Array => new Uint8Array([42]),
      (): Uint8Array => {
        throw new AutoMovieGeneratedFileMissingError("models/ship.json");
      },
    ]) {
      const world: ReturnType<typeof createGeneratedOwnershipReader> = createGeneratedOwnershipReader({
        manifest: null,
        files: [],
        read,
      });
      const diagnostics: IAutoMovieDiagnostic[] = inspectAutoMovieGeneratedOwnership({
        ...world,
        expected,
        repairDeclaredFiles,
      });
      TestValidator.equals(
        "missing ownership and changed bytes are repairable",
        diagnostics.map(({ code, category: value }: IAutoMovieDiagnostic): Pick<IAutoMovieDiagnostic, "code" | "category"> => ({
          code,
          category: value,
        })),
        [
          { code: "generated-manifest-missing", category },
          { code: "generated-tampered", category },
        ],
      );
      TestValidator.equals(
        "manifest diagnostic retains namespace",
        diagnostics[0]!.path,
        "automovie/productions/harbor/generated-manifest.json",
      );
      TestValidator.equals(
        "member diagnostic retains generated address",
        diagnostics[1]!.path,
        "generated/harbor/models/ship.json",
      );
    }
    const empty: IAutoMovieGeneratedManifest = { ...expected, files: [] };
    for (const [kind, read] of [
      ["current", (): Uint8Array => bytes],
      ["edited", (): Uint8Array => new Uint8Array([42])],
      [
        "unreadable",
        (): Uint8Array => {
          throw new Error("Unsafe owned member.");
        },
      ],
    ] as const) {
      const world: ReturnType<typeof createGeneratedOwnershipReader> = createGeneratedOwnershipReader({
        manifest: expected,
        files: ["models/ship.json"],
        read,
      });
      const diagnostics: IAutoMovieDiagnostic[] = inspectAutoMovieGeneratedOwnership({
        ...world,
        expected: empty,
        repairDeclaredFiles,
      });
      TestValidator.equals(
        "only exact former output may be retired",
        diagnostics.map(({ code, category: value }: IAutoMovieDiagnostic): Pick<IAutoMovieDiagnostic, "code" | "category"> => ({
          code,
          category: value,
        })),
        [
          {
            code:
              kind === "current"
                ? "generated-stale-output"
                : "generated-unowned",
            category: kind === "current" ? category : "error",
          },
          { code: "generated-manifest-stale", category },
        ],
      );
    }
    const unowned: ReturnType<typeof createGeneratedOwnershipReader> = createGeneratedOwnershipReader({
      manifest: empty,
      files: ["foreign.bin"],
      read: (): Uint8Array => bytes,
    });
    TestValidator.equals(
      "undeclared bytes cannot be adopted",
      inspectAutoMovieGeneratedOwnership({
        ...unowned,
        expected: empty,
        repairDeclaredFiles,
      }).map(({ code, category }: IAutoMovieDiagnostic): Pick<IAutoMovieDiagnostic, "code" | "category"> => ({ code, category })),
      [{ code: "generated-unowned", category: "error" }],
    );
    TestValidator.equals(
      "undeclared bytes are not read as owned",
      unowned.reads,
      [],
    );
    const stale: ReturnType<typeof createGeneratedOwnershipReader> = createGeneratedOwnershipReader({
      manifest: { ...empty, inputFingerprint: digest(new Uint8Array([6])) },
      files: [],
      read: (): Uint8Array => bytes,
    });
    TestValidator.equals(
      "changed compile input reports both identities",
      inspectAutoMovieGeneratedOwnership({
        ...stale,
        expected: empty,
        repairDeclaredFiles,
      }).map(({ code, category: value }: IAutoMovieDiagnostic): Pick<IAutoMovieDiagnostic, "code" | "category"> => ({ code, category: value })),
      [
        { code: "generated-stale", category },
        { code: "generated-manifest-stale", category },
      ],
    );
  }
}
