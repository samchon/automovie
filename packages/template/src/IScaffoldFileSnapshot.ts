
/**
 * Captured pathname generation of one existing ordinary single-link file.
 *
 * @evidence contracts/common.md#principled-implementation Pathname identity and written versus change-time generations capture an existing ordinary single-link file for in-place replacement.
 * @evidence contracts/common.md#clear-and-simple-design Separate written and full versions let Windows handle-open change-time effects be distinguished from real content changes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The snapshot compares pathname stats with pathname stats instead of assuming Windows descriptor and path device numbers match.
 * @evidence contracts/common.md#meaningful-documentation Members state identity provenance, absolute path and the contents of each version key.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The resident pathname snapshot declaration chooses no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The resident pathname snapshot type coordinates no request or cached work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The resident pathname snapshot schema acquires no runtime handles, bytes or tasks.
 *
 * @author Samchon
 */
export interface IScaffoldFileSnapshot {
  /**
   * `<device>:<inode>` from a pathname stat. It is compared only with other pathname stats, because a Windows pathname stat and a handle stat can report different device numbers.
   */
  identity: string;


  /** Absolute pathname whose resident was captured. */
  path: string;


  /** `written` plus the change time. */
  version: string;


  /** Identity, size, and modification time: what a writer of the file moves. */
  written: string;
}
