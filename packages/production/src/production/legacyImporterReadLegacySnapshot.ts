import path from "node:path";
import { checkAssetPath } from "../project/checkAssetPath";
import { legacyImporterProjectFiles } from "./legacyImporterProjectFiles";
import { legacyImporterProjectDirectories } from "./legacyImporterProjectDirectories";
import type { legacyImporterLegacySnapshot } from "./legacyImporterLegacySnapshot";
import { legacyImporterCaptureRollbackBaseline } from "./legacyImporterCaptureRollbackBaseline";
import { legacyImporterValidateLegacyRoot } from "./legacyImporterValidateLegacyRoot";
import { legacyImporterReadLegacyRevisionSnapshot } from "./legacyImporterReadLegacyRevisionSnapshot";
import { legacyImporterAssertLegacyLock } from "./legacyImporterAssertLegacyLock";
import { legacyImporterEqualOptionalBytes } from "./legacyImporterEqualOptionalBytes";
import { legacyImporterCollectDirectory } from "./legacyImporterCollectDirectory";
import { legacyImporterReadPhysicalFile } from "./legacyImporterReadPhysicalFile";
import { legacyImporterValidateLegacyManifest } from "./legacyImporterValidateLegacyManifest";
import { legacyImporterParseJson } from "./legacyImporterParseJson";

/**
 * Capture legacy manifest, project files, registered assets, directory trees and rollback baselines between matching revision-byte observations under the caller's expected resident-lock state. Missing registered assets remain null inventory entries.
 *
 * @evidence contracts/common.md#principled-implementation Canonical physical-root admission, exact lock-token checks and matching before/after revision bytes bound one optimistic snapshot; registered paths are canonical and case collisions refuse.
 * @evidence contracts/common.md#clear-and-simple-design One capture operation owns inventory population and revision coherence, delegating physical reads, recursive traversal and baseline witnesses to focused helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No filesystem link or case-colliding path silently becomes a legacy asset, and revision/lock drift refuses instead of merging observations; the checks are finite and cooperating-writer premises still matter.
 * @evidence contracts/common.md#meaningful-documentation Documents included populations, absent asset meaning, canonical path/case requirements and optimistic revision coherence rather than atomic filesystem snapshotting.
 * @evidence contracts/performance.md#efficient-algorithms Reads B captured bytes across F entries and D directory depth plus A asset paths, with population-sized maps/arrays and recursion; baseline capture adds its own full byte inventory.
 * @evidence contracts/performance.md#reuse-equivalent-work One path's captured bytes are reused within the snapshot map, and already captured registered paths are not reread; revision and lock evidence are renewed at both boundaries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned snapshot owns retained byte buffers and path/baseline records without a byte/count cap; native owned-file readers close their descriptors and callers retain snapshot values only for the current import decision.
 */
export const legacyImporterReadLegacySnapshot: (rootDirectory: string, lockToken?: string) => legacyImporterLegacySnapshot = (
  rootDirectory: string,
  lockToken?: string,
): legacyImporterLegacySnapshot => {
  const root: string = legacyImporterValidateLegacyRoot(rootDirectory);
  legacyImporterAssertLegacyLock(root, lockToken);
  const revisionBefore: { bytes: Uint8Array | null; revision: number; } = legacyImporterReadLegacyRevisionSnapshot(root);
  const manifestBytes: Uint8Array<ArrayBufferLike> | null = legacyImporterReadPhysicalFile(root, "automovie.json", true);
  const manifest: ReturnType<typeof legacyImporterValidateLegacyManifest> = legacyImporterValidateLegacyManifest(
    legacyImporterParseJson(manifestBytes!, path.join(root, "automovie.json")),
    path.join(root, "automovie.json"),
  );
  const files: Map<string, Uint8Array<ArrayBufferLike> | null> = new Map<string, Uint8Array | null>([
    ["automovie.json", manifestBytes!],
  ]);
  for (const relative of legacyImporterProjectFiles.slice(1)) {
    const bytes: Uint8Array<ArrayBufferLike> | null = legacyImporterReadPhysicalFile(root, relative, false);
    if (bytes !== null) files.set(relative, bytes);
  }
  if (revisionBefore.bytes !== null)
    files.set("revision.json", revisionBefore.bytes);
  for (const relative of legacyImporterProjectDirectories)
    legacyImporterCollectDirectory(root, relative, files);
  const assets: string[] = manifest.assets.map((asset: string): string => {
    const checked: { path: string; } | { fault: string; } = checkAssetPath(asset);
    if ("fault" in checked || checked.path !== asset)
      throw new Error(
        `Legacy manifest asset "${asset}" is not one canonical project-relative path. Correct automovie.json before import.`,
      );
    if (files.has(asset) === false)
      files.set(asset, legacyImporterReadPhysicalFile(root, asset, false));
    return asset;
  });
  const folded: Map<string, string> = new Map<string, string>();
  for (const relative of files.keys()) {
    const previous: string | undefined = folded.get(relative.toLowerCase());
    if (previous !== undefined && previous !== relative)
      throw new Error(
        `Legacy paths "${previous}" and "${relative}" collide by case. Rename one before import.`,
      );
    folded.set(relative.toLowerCase(), relative);
  }
  const rollbackBaseline: ReturnType<typeof legacyImporterCaptureRollbackBaseline> = legacyImporterCaptureRollbackBaseline(root);
  const revisionAfter: { bytes: Uint8Array | null; revision: number; } = legacyImporterReadLegacyRevisionSnapshot(root);
  legacyImporterAssertLegacyLock(root, lockToken);
  if (
    revisionBefore.revision !== revisionAfter.revision ||
    legacyImporterEqualOptionalBytes(revisionBefore.bytes, revisionAfter.bytes) === false
  )
    throw new Error(
      "Legacy project revision changed while the import snapshot was being captured. Retry plan or apply from one stable resident revision.",
    );
  return {
    root,
    revision: revisionBefore.revision,
    assets,
    files,
    rollbackBaseline,
  };
};
