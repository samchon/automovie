/**
 * Captured pathname generation of one existing ordinary file, with whether another directory entry also names it.
 *
 * @evidence contracts/development/design.md#principled-representation Pathname identity, written versus change-time generations and the shared-link flag capture an existing ordinary file, so a writer can choose in-place replacement for a single-link file and entry replacement for a shared one.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separate written and full versions let Windows handle-open change-time effects be distinguished from real content changes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The snapshot compares pathname stats with pathname stats instead of assuming Windows descriptor and path device numbers match.
 * @evidence contracts/development/common.md#meaningful-documentation Members state identity provenance, absolute path and the contents of each version key.
 */
export interface IScaffoldFileSnapshot {
  /**
   * `<device>:<inode>` from a pathname stat. It is compared only with other pathname stats, because a Windows pathname stat and a handle stat can report different device numbers.
   */
  identity: string;

  /** Absolute pathname whose resident was captured. */
  path: string;

  /**
   * Whether more than one directory entry names this file, such as a build cache's hard link. Rewriting a shared file in place would change every other name, so a writer replaces its entry instead.
   */
  shared: boolean;

  /** `written` plus the change time. */
  version: string;

  /** Identity, size, and modification time: what a writer of the file moves. */
  written: string;
}
