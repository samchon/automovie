import type { IHumanViewerResolveIo } from "./IHumanViewerResolveIo.js";
import type { IHumanViewerRevisionReadIo } from "./IHumanViewerRevisionReadIo.js";
import type { IHumanViewerRevisionsEntries } from "./IHumanViewerRevisionsEntries.js";
import type { IHumanViewerNodeInputScope } from "./IHumanViewerNodeInputScope.js";

/**
 * What the revision digests are computed from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#principled-implementation Entry graphs, extra configuration files and basis digests enumerate the inputs that determine each numerical and browser revision.
 * @evidence contracts/common.md#clear-and-simple-design Filesystem existence and text access are borrowed through one combined read port.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cache authority derives from actual input content rather than source filenames alone.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerRevisionsProps {
  /**
   * Repository root with forward slashes; digests hash paths relative to it.
   */
  root: string;

  /** Entry files of each digest's import graph. */
  entries: IHumanViewerRevisionsEntries;

  /** Files that change every result without being imported. */
  extra: readonly string[];

  /** Checked-loader source scope contributing only to browser/admission revision, not numerical model-cache digests. */
  checkedInputs?: IHumanViewerNodeInputScope;

  /**
   * The published basis digests the browser digest also covers.
   *
   * @evidence contracts/common.md#principled-implementation Published basis digests are read when the browser revision is recomputed.
   * @evidence contracts/common.md#clear-and-simple-design Basis identity remains with the source owner, separate from import-graph traversal.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The browser digest cannot omit changed basis bytes merely because code imports stayed unchanged.
   * @evidence contracts/common.md#meaningful-documentation The string contributes the current published-basis digest authority.
   */
  bases: () => string;

  /** File access: existence and text, undefined for an unreadable file. */
  io: IHumanViewerResolveIo & IHumanViewerRevisionReadIo;
}
