
/**
 * One ordinary directory captured by physical identity, so later steps can prove they still operate on the same directory rather than on whatever its path names now.
 *
 * @evidence contracts/common.md#principled-implementation A path can be renamed, replaced, or redirected through a link between two calls, so the capture pairs the lexical path with the device-and-inode identity read from an opened descriptor and with the native real path; a later capture that differs in either value proves the directory changed.
 * @evidence contracts/common.md#clear-and-simple-design Three strings are the whole state the ownership checks compare, and the record has no methods, so capturing and revalidating stay in the functions that own them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record carries no flag that skips a revalidation or trusts a directory without its identity.
 * @evidence contracts/common.md#meaningful-documentation The comment states why identity is captured with the path, and each member states its source and the comparison it serves.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record of three strings chooses no algorithm; capture cost belongs to the functions that build it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record is the reused value itself; `ensureScaffoldFileDirectory` decides when a cached one may be reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record holds three strings and no descriptor; the descriptor that produced the identity is closed before the record exists.
 * @author Samchon
 */
export interface IScaffoldPhysicalDirectory {
  /**
   * `<device>:<inode>` read through a descriptor opened on the directory, which on Windows reports the volume serial number that a path-based stat may report as 0.
   */
  identity: string;


  /** Absolute lexical path of the directory. */
  path: string;


  /**
   * Native real path, compared against the scaffold root's to refuse a directory that a link or junction places outside it.
   */
  real: string;
}
