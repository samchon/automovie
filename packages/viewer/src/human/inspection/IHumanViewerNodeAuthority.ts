/**
 * Actual checked Node numerical realm and its source-byte witnesses. A Node
 * receipt never claims to be a browser transformation stamp.
 *
 * @evidence contracts/common.md#principled-implementation Revision, checked loader, owning project, runtime versions and source-byte inputs identify the actual Node realm that performed the computation.
 * @evidence contracts/common.md#clear-and-simple-design One receipt groups loader and source authority without conflating Node execution with browser transformation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The loader discriminant names the supported checked entry; byte witnesses cannot be replaced by a readiness timestamp.
 * @evidence contracts/common.md#meaningful-documentation Field comments distinguish host-selected source, owning project, Node version, compiler version and input digests.
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
