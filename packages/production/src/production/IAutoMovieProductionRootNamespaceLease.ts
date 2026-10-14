

/**
 * The acquired reservation's canonical root, device/inode strings and exact external coordinate path/token levels. Callers keep the values unchanged, assert them before mutation and release the acquired nesting levels.
 *
 * @evidence contracts/common.md#principled-implementation Pairs physical identity with both coordinate token witnesses so acquisition and mutation guards refer to the same root rather than a pathname alone.
 * @evidence contracts/common.md#clear-and-simple-design Carries one lease value across project/importer scopes, with creation coordination and stable-root ownership kept distinct.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface does not validate arbitrary records or make the returned object deeply immutable; the acquiring operation and caller's preservation of its witnesses remain premises.
 * @evidence contracts/common.md#meaningful-documentation Documents canonical root, dev/ino representation, exact release tokens and caller assertion/lifetime duties.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type executes no algorithm; two-coordinate acquisition and later C-coordinate token checks account for its operational costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares original identity and token values through one scope, while later assertions renew current root/file evidence rather than caching authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner retains coordinate nesting levels until release; the value contains no native descriptor, and abandoned leases can retain fences without an independent time or population bound.
 * @author Samchon
 */
export interface IAutoMovieProductionRootNamespaceLease {
  /**
   * Canonical physical root reserved by this lease.
   */
  root: string;

  /**
   * Fenced coordinate locks held for the namespace.
   */
  locks: ReadonlyArray<{
    /** Absolute external coordinate-lock path acquired for this reservation. */
    path: string;

    /** Exact owner token needed to release the corresponding nesting level. */
    token: string;
  }>;

  /**
   * Physical device identity included in the namespace claim.
   */
  device: string;

  /**
   * Physical inode identity included in the namespace claim.
   */
  inode: string;
}
