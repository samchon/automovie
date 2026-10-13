import type { IHumanViewerResolveIo } from "./IHumanViewerResolveIo.js";
import type { IHumanViewerRevisionReadIo } from "./IHumanViewerRevisionReadIo.js";
import type { IHumanViewerRevisionsEntries } from "./IHumanViewerRevisionsEntries.js";
import type { IHumanViewerNodeInputScope } from "./IHumanViewerNodeInputScope.js";

/**
 * What the revision digests are computed from.
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

  /** The published basis digests the browser digest also covers. */
  bases: () => string;

  /** File access: existence and text, undefined for an unreadable file. */
  io: IHumanViewerResolveIo & IHumanViewerRevisionReadIo;
}
