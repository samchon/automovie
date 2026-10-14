import { compareCodeUnits } from "./contentIdentity";
import { legacyImporterRetiredEmptyStateDirectories } from "./legacyImporterRetiredEmptyStateDirectories";
import type { legacyImporterAppliedImportState } from "./legacyImporterAppliedImportState";
import { legacyImporterReadPhysicalFile } from "./legacyImporterReadPhysicalFile";
import { legacyImporterValidatePlan } from "./legacyImporterValidatePlan";
import { legacyImporterAppliedImportFiles } from "./legacyImporterAppliedImportFiles";
import { legacyImporterExpectedStateDirectories } from "./legacyImporterExpectedStateDirectories";
import { legacyImporterCollectStateTree } from "./legacyImporterCollectStateTree";
import { legacyImporterEqualStrings } from "./legacyImporterEqualStrings";
import { legacyImporterReadAppliedImportState } from "./legacyImporterReadAppliedImportState";
import { legacyImporterInvalidLegacyImportJsonError } from "./legacyImporterInvalidLegacyImportJsonError";

/**
 * Accept only the admitted plan/incarnation and exact expected state-directory/file population with byte-for-byte provenance equality, optionally including this operation's revision.lock bytes. Malformed import JSON and recognized absence return false; unrelated read, identity and cleanup failures propagate unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Runtime plan/state admission, complete directory/file inventory and exact expected byte composition jointly distinguish an untouched import from later production work.
 * @evidence contracts/common.md#clear-and-simple-design One predicate is shared by unchanged apply, rollback admission and quarantine restoration, with byte composition and tree collection supplied by their canonical helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The retired review-directory set is accepted only absent or complete and empty for old import compatibility; unrelated files refuse. Only malformed import JSON or ENOENT/ENOTDIR become false, while no-code native identity and cleanup failures retain their original cause.
 * @evidence contracts/common.md#meaningful-documentation Documents exact population/bytes, optional owned lock tolerance, retired empty-directory compatibility and the precise false-versus-throw boundary.
 * @evidence contracts/performance.md#efficient-algorithms Scans F state entries and reads B expected bytes, builds expected JSON bytes and sorts path inventories; peak storage follows encoded expected files, tree paths and the largest current file read.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares exact file composition with publication/restoration and one current state witness within this call, but rereads bytes rather than trusting a persisted fingerprint alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned readers attempt descriptor closure and local buffers expire on return; failed identity or native cleanup propagates unchanged instead of falsely reporting ordinary state mismatch or completed physical release.
 */
export const legacyImporterVerifyAppliedImport: (stateRoot: string, root: string, planValue: unknown, appliedState?: legacyImporterAppliedImportState | null, toleratedFile?: { path: string; bytes: Uint8Array }) => boolean = (
  stateRoot: string,
  root: string,
  planValue: unknown,
  appliedState?: legacyImporterAppliedImportState | null,
  toleratedFile?: { path: string; bytes: Uint8Array },
): boolean => {
  try {
    const currentState: legacyImporterAppliedImportState | null =
      appliedState === undefined
        ? legacyImporterReadAppliedImportState(stateRoot, planValue)
        : appliedState;
    if (legacyImporterValidatePlan(planValue) === false || currentState === null)
      return false;
    const expected: ReadonlyMap<string, Uint8Array<ArrayBufferLike>> = legacyImporterAppliedImportFiles(root, planValue, currentState);
    const expectedFiles: string[] = [...expected.keys()];
    if (toleratedFile !== undefined) expectedFiles.push(toleratedFile.path);
    expectedFiles.sort(compareCodeUnits);
    const tree: { directories: string[]; files: string[]; } = legacyImporterCollectStateTree(stateRoot);
    const retiredDirectories: string[] = tree.directories.filter((directory: string): boolean =>
      legacyImporterRetiredEmptyStateDirectories.has(directory),
    );
    const activeDirectories: string[] = tree.directories.filter(
      (directory: string): boolean => legacyImporterRetiredEmptyStateDirectories.has(directory) === false,
    );
    if (
      (retiredDirectories.length !== 0 &&
        retiredDirectories.length !== legacyImporterRetiredEmptyStateDirectories.size) ||
      legacyImporterEqualStrings(activeDirectories, legacyImporterExpectedStateDirectories()) === false ||
      legacyImporterEqualStrings(tree.files, expectedFiles) === false
    )
      return false;
    for (const [relative, bytes] of expected) {
      const actual: Uint8Array<ArrayBufferLike> | null = legacyImporterReadPhysicalFile(stateRoot, relative, true);
      if (
        actual === null ||
        Buffer.from(actual).equals(Buffer.from(bytes)) === false
      )
        return false;
    }
    if (toleratedFile !== undefined) {
      const actual: Uint8Array<ArrayBufferLike> | null = legacyImporterReadPhysicalFile(stateRoot, toleratedFile.path, true);
      if (
        actual === null ||
        Buffer.from(actual).equals(Buffer.from(toleratedFile.bytes)) === false
      )
        return false;
    }
    return true;
  } catch (error) {
    if (error instanceof legacyImporterInvalidLegacyImportJsonError) return false;
    const code: string | undefined = (error as NodeJS.ErrnoException | null | undefined)?.code;
    if (code === "ENOENT" || code === "ENOTDIR") return false;
    throw error;
  }
};
