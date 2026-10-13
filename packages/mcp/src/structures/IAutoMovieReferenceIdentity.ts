/**
 * Native pathname or held-descriptor facts used to reject aliases, substitution and concurrent writes. Values are observations, not a namespace lock.
 *
 * @evidence contracts/common.md#principled-implementation Bigint native kind, device, inode, links, extent and timestamps represent one pathname or descriptor observation.
 * @evidence contracts/common.md#clear-and-simple-design One value keeps identity, version and physical-link facts separate for platform-specific comparisons.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observations do not claim a namespace lock or automatic equivalence across Windows path and handle bases.
 * @evidence contracts/common.md#meaningful-documentation Members document observation bases, nanosecond timestamps and one-link source admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased observation schema holds no native descriptor; createAutoMovieReferenceFileSystem copies bigint stat values into records that the reader retains for pinned ancestry or a single read boundary.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceIdentity {

  /** Entry type without following a symbolic link. */
  kind: "file" | "directory" | "link" | "other";

  /** Device on this observation's pathname or descriptor basis. */
  device: bigint;

  /** Native file identity on that device. */
  inode: bigint;

  /** Authored regular sources require exactly one physical link. */
  links: bigint;

  /** Observed byte extent, bounded before read-buffer allocation. */
  size: bigint;

  /** Nanosecond content-modification observation. */
  modified: bigint;

  /** Nanosecond metadata-change observation; own opens can affect it on Windows. */
  changed: bigint;
}
