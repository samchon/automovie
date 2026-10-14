


/**
 * The scalar lstat observations used to admit one independently owned population file.
 *
 * @author Samchon
 */
interface IAutoMovieEvidencePhysicalFile {

  /** Whether lstat classified the entry as a regular file. */
  isFile(): boolean;

  /** Whether lstat classified the entry as a symbolic link. */
  isSymbolicLink(): boolean;

  /** Number of directory entries naming the same physical inode. */
  nlink: number | bigint;
}


/**
 * Decide whether one enumerated lstat entry is an independently owned evidence file.
 *
 * The population walker uses this single-link requirement because a walk can reach one inode through two names, which would otherwise become two independent graph owners of one set of bytes. Numeric and bigint observations follow the same regular-file, nonsymlink and exactly-one-link decision.
 *
 * @author Samchon
 *
 *
 * @evidence contracts/common.md#principled-implementation A current lstat observation must report regular nonsymlink bytes with exactly one native directory link.
 * @evidence contracts/common.md#clear-and-simple-design Population identity admission prevents one physical inode from becoming multiple graph owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same single-link rule accepts numeric or bigint native observations without accepting hardlink aliases.
 * @evidence contracts/common.md#meaningful-documentation The comment states the actual population-walker consumer, why hardlink aliases refuse and the equivalent numeric/bigint observation policy.
 * @evidence contracts/performance.md#efficient-algorithms Three scalar observations take O(1) work per entry.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied observation is judged once; no identity is cached across filesystem changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No state, byte buffer or descriptor is retained by this predicate.
 */
export const isAutoMovieEvidencePhysicalFile: (entry: IAutoMovieEvidencePhysicalFile) => boolean = (
  entry: IAutoMovieEvidencePhysicalFile,
): boolean =>
  entry.isFile() &&
  entry.isSymbolicLink() === false &&
  (entry.nlink === 1 || entry.nlink === 1n);
