interface IAutoMovieEvidenceIdentityFile {

  /** Whether lstat classified the entry as a regular file. */
  isFile(): boolean;

  /** Whether lstat classified the entry as a symbolic link. */
  isSymbolicLink(): boolean;
}

/**
 * Decide whether one lstat entry may be read as the project identity manifest.
 *
 * This is the admission judgment for a manifest the graph reads once at a fixed
 * path, which is why it asks nothing about directory entries. A path that is
 * never enumerated cannot become a second owner inside the graph, and an alias
 * whose bytes are identical yields the same name and description, so counting
 * entries here would refuse an input that carries exactly one identity. A
 * symbolic link stays refused because it would admit a manifest from outside
 * the project root, and an entry that is not a regular file carries no manifest
 * bytes at all. The population judgment is a different decision and keeps its
 * own single-link requirement.
 *
 * @author Samchon
 *
 *
 * @evidence contracts/common.md#principled-implementation One fixed-path lstat observation must be a regular nonsymlink file; unlike population ownership, its hardlink count is not used.
 * @evidence contracts/common.md#clear-and-simple-design Manifest identity is independent from a directory walk that could expose one inode under multiple owner names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Links and nonfiles refuse, while a same-byte hardlink does not fabricate a second graph owner at this fixed path.
 * @evidence contracts/common.md#meaningful-documentation The comment states fixed-path semantics and separate population single-link admission.
 * @evidence contracts/performance.md#efficient-algorithms Two scalar checks use O(1) work without enumerating a directory.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the current supplied stat is used; no quiet-path cache stands in for identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The predicate acquires and retains no file resource or source bytes.
 */
export const isAutoMovieEvidenceIdentityFile: (entry: IAutoMovieEvidenceIdentityFile) => boolean = (
  entry: IAutoMovieEvidenceIdentityFile,
): boolean => entry.isFile() && entry.isSymbolicLink() === false;
