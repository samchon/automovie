import type { IAutoMovieProductionEvidence, IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import type { ICompletionSnapshot } from "./ICompletionSnapshot";
import { createLibraryCompletionEvidence } from "./createLibraryCompletionEvidence";

/**
 * A typed memory snapshot for an exact library source and owner edge.
 *
 * @evidence contracts/common.md#principled-implementation Projects the existing library evidence fixture into the resident execution-plan snapshot with one exact source path and digest and a declared synthetic snapshot digest.
 * @evidence contracts/common.md#clear-and-simple-design Keeps snapshot construction separate from the real plan function while the backward fixture barrel preserves both original imports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The synthetic digest and omitted unobserved fields are explicit fixture assumptions; they do not authenticate a real authoring snapshot or override admission.
 * @evidence contracts/common.md#meaningful-documentation Documents the resident fields the tested plan reads and the exact binding input; execution tests own assertions rather than this constructor.
 * @evidence contracts/performance.md#efficient-algorithms Creates fixed snapshot records and a single source entry after fixed-size evidence construction; it does not read source bytes or scan files.
 * @evidence contracts/performance.md#reuse-equivalent-work Constructs fresh outer records on each call and reuses references to the evidence records just created for that call; it retains no cache across cases.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Snapshot records and their evidence references live with the returned snapshot under ordinary reachability; no file descriptor, native allocation or task is acquired.
 */
export function createLibraryCompletionSnapshot(
  binding: IAutoMovieProductionEvidenceSourceOwnerBinding,
): ICompletionSnapshot {
  const evidence: IAutoMovieProductionEvidence = createLibraryCompletionEvidence([binding]);
  return {
    version: 1 as const,
    protocol: "automovie.library-authoring-snapshot.v1" as const,
    root: evidence.root,
    packageName: evidence.packageName,
    kind: "library" as const,
    configuration: evidence.configuration,
    manifest: evidence.manifest,
    designBranches: evidence.designBranches,
    designOwners: evidence.designOwners,
    sourceOwners: evidence.sourceOwners,
    sources: [{ path: binding.sourcePath, digest: binding.sourceDigest }],
    digest: `sha256:${"2".repeat(64)}` as const,
  };
}
