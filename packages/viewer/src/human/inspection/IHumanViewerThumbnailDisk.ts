/**
 * Thumbnail storage borrows directory metadata, existence checking and removal for paths selected by its folder policy.
 *
 * @evidence contracts/common.md#principled-implementation Thumbnail storage borrows directory metadata, existence checking and removal for paths selected by its folder policy.
 * @evidence contracts/common.md#clear-and-simple-design Three filesystem operations keep retention selection with the thumbnail store and actual disk effects with the host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The port declares neither external path discovery nor numerical-cache deletion; the store supplies selected thumbnail paths.
 * @evidence contracts/common.md#meaningful-documentation Defines revision-directory modification times, file existence and the destructive directory-removal operation.
 * @author Samchon
 */
export interface IHumanViewerThumbnailDisk {
  /**
   * The revision directories of the thumbnail folder with their modification times.
   *
   * @evidence contracts/common.md#principled-implementation Directory enumeration returns revision names and actual modification times for the requested thumbnail folder.
   * @evidence contracts/common.md#clear-and-simple-design The disk port returns facts while the store chooses which revisions to retain.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Enumerated timestamps do not authorize pruning paths outside the selected thumbnail folder.
   * @evidence contracts/common.md#meaningful-documentation Defines folder-local revision directories and millisecond modification times.
   */
  directories(folder: string): { name: string; mtimeMs: number }[];

  /**
   * Whether a file exists.
   *
   * @evidence contracts/common.md#principled-implementation Existence checks a candidate thumbnail path supplied by the store.
   * @evidence contracts/common.md#clear-and-simple-design The store retains current/stale lookup policy outside the disk predicate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A present old thumbnail is not relabelled as current by the existence result.
   * @evidence contracts/common.md#meaningful-documentation Names the file-existence question without assigning freshness.
   */
  exists(file: string): boolean;

  /**
   * Delete a directory tree.
   *
   * @evidence contracts/common.md#principled-implementation Removal applies to a directory tree selected by the thumbnail retention owner.
   * @evidence contracts/common.md#clear-and-simple-design The host owns the disk effect while the store supplies the exact path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This port does not choose unrelated directories or delete numerical runtime caches.
   * @evidence contracts/common.md#meaningful-documentation States the destructive directory-tree effect and the caller-supplied path.
   */
  remove(path: string): void;
}
