/**
 * Actual checked Node numerical realm and its source-byte witnesses. A Node
 * receipt never claims to be a browser transformation stamp.
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
