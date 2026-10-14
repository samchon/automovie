/**
 * Thumbnail storage borrows directory metadata, existence checking and removal for paths selected by its folder policy.
 *
 * @evidence contracts/common.md#principled-implementation Directory metadata, file existence and removal form the filesystem capabilities needed by revision-folder thumbnail retention.
 * @evidence contracts/common.md#clear-and-simple-design The disk seam leaves revision selection and path policy with the thumbnail store rather than duplicating those rules in filesystem access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Deletion is limited by the caller's thumbnail-folder policy; the seam contains no numerical-cache or subject-specific removal operation.
 * @evidence contracts/common.md#meaningful-documentation Comments identify revision directory modification times, file existence and recursive directory removal semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Disk method signatures select no revision sorting or pruning algorithm; the store and prune planner own those choices.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Filesystem observations are borrowed and uncached by this interface; store requests may see new thumbnail revisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The store owns revision directories under its thumbnail folder and removes obsolete trees; the adapter owns transient filesystem handles.
 *
 * @author Samchon
 */
export interface IHumanViewerThumbnailDisk {
  /**
   * The revision directories of the thumbnail folder with their modification times.
   *
   * @evidence contracts/common.md#principled-implementation Directory names and modification times provide the store's inputs for choosing current and previous thumbnail revisions.
   * @evidence contracts/common.md#clear-and-simple-design Metadata listing stays in the disk adapter while revision retention policy remains in the prune planner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This listing describes the actual thumbnail folder rather than a hardcoded list of revision names.
   * @evidence contracts/common.md#meaningful-documentation The member identifies revision directories and modification-time metadata; absent-folder behavior belongs to its adapter.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The listing signature does not choose filesystem traversal or revision ordering algorithms.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Directory metadata is queried from mutable disk state; no snapshot reuse is promised by this seam.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Directory names and scalar times transfer no directory handle to the thumbnail store.
   */
  directories(folder: string): { name: string; mtimeMs: number }[];

  /**
   * Whether a file exists.
   *
   * @evidence contracts/common.md#principled-implementation Thumbnail existence determines whether an older revision can supply a stale display picture.
   * @evidence contracts/common.md#clear-and-simple-design The disk answers presence while the thumbnail store chooses which candidate path to ask about.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Presence is supplied by disk rather than assumed for selected document ids.
   * @evidence contracts/common.md#meaningful-documentation The member documents the boolean presence result for the requested file.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A one-file presence signature specifies no disk lookup algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Thumbnail presence can change after writes or pruning and has no declared memoization here.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The presence query returns no open thumbnail stream or image allocation.
   */
  exists(file: string): boolean;

  /**
   * Delete a directory tree selected by the thumbnail store's folder policy.
   *
   * @evidence contracts/common.md#principled-implementation Recursive removal retires an obsolete revision tree chosen by the current/previous retention policy.
   * @evidence contracts/common.md#clear-and-simple-design The store owns path selection and the disk adapter owns the actual filesystem deletion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only policy-selected thumbnail paths enter removal; the contract does not authorize deleting numerical basis or cache files.
   * @evidence contracts/common.md#meaningful-documentation The member specifies recursive directory deletion and identifies the caller responsible for folder-policy selection.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This removal capability does not select recursive filesystem traversal internals.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Deletion changes disk state and is not a cached result transferable to another revision path.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Removing the selected tree releases its obsolete thumbnail files; the thumbnail folder remains owned by the store.
   */
  remove(path: string): void;
}
