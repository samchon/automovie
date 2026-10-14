import type {
  IAutoMovieDiagnostic,
  IAutoMovieGeneratedManifest,
  IAutoMovieGeneratedFile,
} from "@automovie/interface";
import path from "node:path";

import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { AutoMovieGeneratedFileMissingError } from "./AutoMovieGeneratedFileMissingError";
import {
  canonicalAutoMovieJsonBytes,
  digestAutoMovieBytes,
} from "./contentIdentity";
import { generatedOwnershipDiagnosticMessage } from "./generatedOwnershipDiagnosticMessage";
import { normalizeSlash } from "./productionBuildDiagnostics";

/**
 * Compare resident generated ownership with the exact result derived now.
 *
 * Both timed and library builders use this policy before publication. The
 * project reader owns physical fencing and returns exact bytes; the host lists
 * the generated root, while this module owns stale, unowned, unsafe and changed
 * output diagnostics. It never writes. Only a matching prior owned output may
 * be retired automatically, and repair mode downgrades repairable differences
 * without admitting unsafe paths or unowned files.
 *
 * File observations precede whole-manifest comparison so each unsafe or
 * mismatched member retains its own address. A missing owned file is reported
 * through the reader's existing missing-file refusal; other read failures stay
 * unsafe. Publication must still confirm the input snapshot after this check,
 * since these observations alone do not establish a transaction snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Exact expected/prior path maps and current byte digests distinguish stale owned output from unowned entries; only the project's typed missing-file observation is repairable absence, while manifest identity and full canonical contents are compared independently.
 * @evidence contracts/common.md#clear-and-simple-design Timed and library coordinators share one read-only ownership policy; physical project readers own namespace/link fencing and the transaction owner separately confirms inputs and publishes or retires owned output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsafe/unowned observations never become repairable warnings, Error text does not prove absence, and prior filename ownership alone cannot authorize stale-output removal without matching prior bytes.
 * @evidence contracts/common.md#meaningful-documentation States read-only policy, exact-byte prior ownership, repair severity, typed absence and post-check transaction requirement.
 * @evidence contracts/performance.md#efficient-algorithms For E expected and P prior entries, maps cost O(E+P) space/time plus normalized path text; the physical scan and expected-file scan read/hash relevant current bytes, then full canonical manifest comparison sorts object keys. Distinct observed files are read for their required ownership comparison and full bytes are not retained after hashing.
 * @evidence contracts/performance.md#reuse-equivalent-work Expected and prior maps serve all per-file membership checks inside one attempt; current filesystem bytes are freshly observed and no previous ownership answer is cached across edits or namespace replacement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps and current buffers are local to the inspection, diagnostics transfer to compilation and grow with observed faults; project readers and the listing callback own filesystem handles and this policy performs no write or independent task.
 */
export function inspectAutoMovieGeneratedOwnership(props: {
  /** Fenced reader for resident generated records and bytes. */
  project: Pick<
    AutoMovieProductionProject,
    | "root"
    | "generatedManifest"
    | "generatedRoot"
    | "trackedStatePath"
    | "readGeneratedFile"
  >;

  /** Exact manifest derived from the current design, source and protocol. */
  expected: IAutoMovieGeneratedManifest;

  /** Whether the caller will atomically replace repairable owned output. */
  repairDeclaredFiles: boolean;

  /** Host-owned physical listing, including links so they cannot disappear. */
  listFiles: (root: string) => string[];
}): IAutoMovieDiagnostic[] {
  const { expected, repairDeclaredFiles }: typeof props = props;
  const manifest: IAutoMovieGeneratedManifest | null = props.project.generatedManifest();
  const generatedRoot: string = props.project.generatedRoot();
  const generatedManifestPath: string = normalizeSlash(
    path.relative(
      props.project.root,
      props.project.trackedStatePath("generated-manifest.json"),
    ),
  );
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const expectedByPath: Map<string, IAutoMovieGeneratedFile> = new Map(
    expected.files.map((file: IAutoMovieGeneratedFile): [string, IAutoMovieGeneratedFile] => [normalizeSlash(file.path), file]),
  );
  const declaredByPath: Map<string, IAutoMovieGeneratedFile> = new Map(
    (manifest?.files ?? []).map((file: IAutoMovieGeneratedFile): [string, IAutoMovieGeneratedFile] => [normalizeSlash(file.path), file]),
  );
  if (manifest === null)
    diagnostics.push({
      code: "generated-manifest-missing",
      category: repairDeclaredFiles ? "warning" : "error",
      phase: "compile",
      target: "generated-manifest",
      path: generatedManifestPath,
      message: repairDeclaredFiles
        ? "Compiler-owned output has no generated manifest. The builder will publish the exact current ownership manifest with the derived files."
        : "Compiler-owned output has no generated manifest. Run the scaffold compile command before trusting generated bytes.",
    });
  for (const file of props.listFiles(generatedRoot)) {
    const relative: string = normalizeSlash(
      path.relative(generatedRoot, file),
    );
    if (expectedByPath.has(relative) === false) {
      const declared: IAutoMovieGeneratedFile | undefined = declaredByPath.get(relative);
      let matchesDeclared: boolean = false;
      try {
        matchesDeclared =
          declared !== undefined &&
          digestAutoMovieBytes(props.project.readGeneratedFile(relative)) ===
            declared.digest;
      } catch {
        matchesDeclared = false;
      }
      diagnostics.push({
        code: matchesDeclared ? "generated-stale-output" : "generated-unowned",
        category: matchesDeclared && repairDeclaredFiles ? "warning" : "error",
        phase: "compile",
        target: relative,
        path: normalizeSlash(path.relative(props.project.root, file)),
        message: matchesDeclared
          ? repairDeclaredFiles
            ? `Generated file "${relative}" belonged to the prior builder result but is absent from the current result. The builder will remove it.`
            : `Generated file "${relative}" is stale output from a different compile. Run the scaffold compile command to remove it.`
          : `Generated file "${relative}" is not the canonical output derived from current source and design. Remove it before running the builder.`,
      });
    }
  }
  for (const entry of expected.files) {
    const file: string = path.resolve(generatedRoot, entry.path);
    let actual: string | null = null;
    try {
      actual = digestAutoMovieBytes(
        props.project.readGeneratedFile(entry.path),
      );
    } catch (error) {
      if (error instanceof AutoMovieGeneratedFileMissingError)
        actual = null;
      else {
        diagnostics.push({
          code: "generated-path-outside",
          category: "error",
          phase: "compile",
          target: entry.path,
          path: normalizeSlash(path.relative(props.project.root, file)),
          message:
            error instanceof Error
              ? error.message
              : `Generated file "${entry.path}" is unsafe. Remove the link before running the builder.`,
        });
        continue;
      }
    }
    if (actual !== entry.digest)
      diagnostics.push({
        code: "generated-tampered",
        category: repairDeclaredFiles ? "warning" : "error",
        phase: "compile",
        target: entry.path,
        path: normalizeSlash(path.relative(props.project.root, file)),
        message: generatedOwnershipDiagnosticMessage({
          actual,
          expected: entry.digest,
          repair: repairDeclaredFiles,
        }),
      });
  }
  if (
    manifest !== null &&
    manifest.inputFingerprint !== expected.inputFingerprint
  )
    diagnostics.push({
      code: "generated-stale",
      category: repairDeclaredFiles ? "warning" : "error",
      phase: "compile",
      target: "generated-manifest",
      path: generatedManifestPath,
      message: repairDeclaredFiles
        ? `Generated input ${manifest.inputFingerprint} differs from current ${expected.inputFingerprint}. The builder will refresh all builder-owned output.`
        : `Generated input ${manifest.inputFingerprint} differs from current ${expected.inputFingerprint}. Run the scaffold compile command before trusting generated output.`,
    });
  if (
    manifest !== null &&
    Buffer.from(canonicalAutoMovieJsonBytes(manifest)).equals(
      Buffer.from(canonicalAutoMovieJsonBytes(expected)),
    ) === false
  )
    diagnostics.push({
      code: "generated-manifest-stale",
      category: repairDeclaredFiles ? "warning" : "error",
      phase: "compile",
      target: "generated-manifest",
      path: generatedManifestPath,
      message: repairDeclaredFiles
        ? "The generated manifest does not exactly match builder-derived inventory, digests, identity, and provenance. The builder will replace it."
        : "The generated manifest does not exactly match builder-derived inventory, digests, identity, and provenance. Run the scaffold compile command before trusting generated output.",
    });
  return diagnostics;
}
