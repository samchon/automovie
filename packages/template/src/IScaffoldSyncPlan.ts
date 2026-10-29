import type { IScaffoldFileSnapshot } from "./IScaffoldFileSnapshot";

/**
 * The complete observed instruction update before mutation.
 *
 * @evidence contracts/common.md#principled-implementation The plan couples candidate bytes with the exact target file generations observed during conflict detection.
 * @evidence contracts/common.md#clear-and-simple-design One record exposes updates, unchanged paths, conflicts and retained retired paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A conflict is not a completed update; obsolete files are reported instead of deleted through successor pathnames.
 * @evidence contracts/common.md#meaningful-documentation Members identify output bytes, preconditions and the legacy-state boundary.
 * @evidence contracts/performance.md#efficient-algorithms Record size follows selected file count and candidate bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work One plan reuses captured file generations within a single application only.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The plan retains strings and scalar snapshots under caller ownership, without open handles.
 */
export interface IScaffoldSyncPlan {
  /** Absolute target root. */
  location: string;
  /** Changed instruction bytes, followed by the new state only after all content. */
  files: Record<string, string>;
  /** Expected generation for each candidate; null means the file must remain absent. */
  expected: Record<string, IScaffoldFileSnapshot | null>;
  /** Managed instruction paths whose current text differs from the bundle. */
  changed: string[];
  /** Managed paths already matching the bundle. */
  unchanged: string[];
  /** Local changes or unbased existing differences that prevent any write. */
  conflicts: string[];
  /** Previously generated paths no longer supplied; retained for explicit retirement. */
  retired: string[];
}
