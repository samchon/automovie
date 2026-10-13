/**
 * Actual checked Node numerical realm and its source-byte witnesses. A Node receipt never claims to be a browser transformation stamp.
 *
 * @evidence contracts/common.md#principled-implementation Receipts the actual checked Node realm's loader/project/version and byte/membership witness after its maintained entry loaded.
 * @evidence contracts/common.md#clear-and-simple-design Keeps Node compiler authority distinct from browser transformation stamps and host-selected source revision intent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A Node receipt never claims browser compile identity; current host bytes and source must still match before readiness/commands are accepted.
 * @evidence contracts/common.md#meaningful-documentation Documents loader, nearest project, Node/compiler versions and input digests without authenticating physiological or rendered results.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no reads; authority owner locates actual loader/project and recomputes selected input membership/bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Concurrent endpoint requests share checked readiness, but replaced inputs/revision refuse reuse of the old realm.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each session/page retains its source witness until retirement; witness size has no independent cap and no worker handle transfers in this record.
 *
 * @author Samchon
 */
export interface IHumanViewerNodeAuthority {
  /** Source revision selected by the host before this owned realm starts. */
  revision: string;

  /** Public checked loader that admitted the TypeScript entry. */
  loader: "ttsc/register";

  /** Actual nearest owning project used by the checked loader. */
  project: string;

  /** Running Node version, independently of the browser's V8. */
  node: string;

  /** Installed compiler package version. */
  compiler: string;

  /** Byte digest per actual watched input after the entry loaded. */
  inputs: Record<string, string>;
}
