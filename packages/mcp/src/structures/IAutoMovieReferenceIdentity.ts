/**
 * Native pathname or held-descriptor facts used to reject aliases, substitution
 * and concurrent writes. Values are observations, not a namespace lock.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-isolation Distinguishes a physical single-link source from an alias or changed allocation.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-isolation Retains device, inode, links and write metadata for like-observation comparisons.
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
