/**
 * Native pathname or held-descriptor facts used to reject aliases, substitution
 * and concurrent writes. Values are observations, not a namespace lock.
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
