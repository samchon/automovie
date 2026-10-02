import type { AutoMovieContentDigest, IAutoMovieDiagnostic, IAutoMovieGeneratedManifest } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createHash } from "node:crypto";
import path from "node:path";
import { loadSourceModule } from "../internal/loadSourceModule";
import { createGeneratedOwnershipReader } from "../internal/createGeneratedOwnershipReader";

const { inspectAutoMovieGeneratedOwnership } = loadSourceModule<{
  inspectAutoMovieGeneratedOwnership(props: {
    project: ReturnType<typeof createGeneratedOwnershipReader>["project"];
    listFiles: (root: string) => string[];
    expected: IAutoMovieGeneratedManifest;
    repairDeclaredFiles: boolean;
  }): IAutoMovieDiagnostic[];
}>(path.resolve(__dirname, "../../../../packages/production/src/production/inspectAutoMovieGeneratedOwnership.ts"));

const digest = (bytes: Uint8Array): AutoMovieContentDigest =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

/**
 * Ownership is established by exact bytes rather than a resident pathname.
 *
 * Scenarios:
 * 1. Missing manifests and changed or absent expected bytes refuse lint and
 *    remain repairable warnings for a build.
 * 2. A byte-identical retired member is stale owned output, whereas an edited,
 *    unreadable or undeclared extra always refuses both modes.
 * 3. Input and whole-manifest changes have separate diagnostic identities.
 */
export const test_production_generated_ownership_refusal = (): void => {
  const bytes = new Uint8Array([17, 23, 41]);
  const expected: IAutoMovieGeneratedManifest = {
    version: 1,
    builder: { packageVersion: "unit", protocolVersion: "1" },
    inputFingerprint: digest(new Uint8Array([5])),
    files: [{ path: "models/ship.json", owner: "builder", digest: digest(bytes), sourceTargets: ["model:ship"] }],
  };
  for (const repairDeclaredFiles of [false, true]) {
    const category = repairDeclaredFiles ? "warning" : "error";
    for (const read of [() => new Uint8Array([42]), (): Uint8Array => { throw new Error("Owned output does not exist."); }]) {
      const world = createGeneratedOwnershipReader({ manifest: null, files: [], read });
      const diagnostics = inspectAutoMovieGeneratedOwnership({ ...world, expected, repairDeclaredFiles });
      TestValidator.equals("missing ownership and changed bytes are repairable", diagnostics.map(({ code, category: value }) => ({ code, category: value })), [
        { code: "generated-manifest-missing", category }, { code: "generated-tampered", category },
      ]);
      TestValidator.equals("manifest diagnostic retains namespace", diagnostics[0]!.path, "automovie/productions/harbor/generated-manifest.json");
      TestValidator.equals("member diagnostic retains generated address", diagnostics[1]!.path, "generated/harbor/models/ship.json");
    }
    const empty = { ...expected, files: [] };
    for (const [kind, read] of [
      ["current", () => bytes],
      ["edited", () => new Uint8Array([42])],
      ["unreadable", (): Uint8Array => { throw new Error("Unsafe owned member."); }],
    ] as const) {
      const world = createGeneratedOwnershipReader({ manifest: expected, files: ["models/ship.json"], read });
      const diagnostics = inspectAutoMovieGeneratedOwnership({ ...world, expected: empty, repairDeclaredFiles });
      TestValidator.equals("only exact former output may be retired", diagnostics.map(({ code, category: value }) => ({ code, category: value })), [
        { code: kind === "current" ? "generated-stale-output" : "generated-unowned", category: kind === "current" ? category : "error" },
        { code: "generated-manifest-stale", category },
      ]);
    }
    const unowned = createGeneratedOwnershipReader({ manifest: empty, files: ["foreign.bin"], read: () => bytes });
    TestValidator.equals("undeclared bytes cannot be adopted", inspectAutoMovieGeneratedOwnership({ ...unowned, expected: empty, repairDeclaredFiles }).map(({ code, category }) => ({ code, category })), [{ code: "generated-unowned", category: "error" }]);
    TestValidator.equals("undeclared bytes are not read as owned", unowned.reads, []);
    const stale = createGeneratedOwnershipReader({ manifest: { ...empty, inputFingerprint: digest(new Uint8Array([6])) }, files: [], read: () => bytes });
    TestValidator.equals("changed compile input reports both identities", inspectAutoMovieGeneratedOwnership({ ...stale, expected: empty, repairDeclaredFiles }).map(({ code, category: value }) => ({ code, category: value })), [
      { code: "generated-stale", category }, { code: "generated-manifest-stale", category },
    ]);
  }
};
