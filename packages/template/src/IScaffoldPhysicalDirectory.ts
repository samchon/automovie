/**
 * One ordinary directory captured by physical identity, so later steps can prove they still operate on the same directory rather than on whatever its path names now.
 *
 * @evidence contracts/development/design.md#principled-representation A path can be renamed, replaced, or redirected through a link between two calls, so the capture pairs the lexical path with the device-and-inode identity read from an opened descriptor and with the native real path; a later capture that differs in either value proves the directory changed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three strings are the whole state the ownership checks compare, and the record has no methods, so capturing and revalidating stay in the functions that own them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record carries no flag that skips a revalidation or trusts a directory without its identity.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states why identity is captured with the path, and each member states its source and the comparison it serves.
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
