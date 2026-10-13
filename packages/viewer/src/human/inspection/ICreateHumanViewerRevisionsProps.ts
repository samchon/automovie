import type { IHumanViewerResolveIo } from "./IHumanViewerResolveIo.js";
import type { IHumanViewerRevisionReadIo } from "./IHumanViewerRevisionReadIo.js";
import type { IHumanViewerRevisionsEntries } from "./IHumanViewerRevisionsEntries.js";
import type { IHumanViewerNodeInputScope } from "./IHumanViewerNodeInputScope.js";

/**
 * What the revision digests are computed from.
 *
 * @evidence contracts/common.md#principled-implementation Revision ownership hashes complete literal import graphs plus explicit extras; optional checked byte/membership witnesses affect browser admission without changing unrelated numerical-domain keys.
 * @evidence contracts/common.md#clear-and-simple-design Groups graph entries, path root, basis contribution and IO so one owner computes browser/face/body/person identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Barrel dependency graphs remain complete; missing reads hash empty text and invalidation relies on delivered change events, not watcher quietness as proof.
 * @evidence contracts/common.md#meaningful-documentation Documents normalized root paths, non-imported extras and checked-loader scope; source digests identify code inputs rather than rendered geometry or artifact authenticity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type performs no hashing; graph traversal, deterministic path sorting and byte hashing scale with reached inputs and edges.
 * @evidence contracts/performance.md#reuse-equivalent-work The revision owner memoizes source text by path until changed events, refreshes existence per batch and prunes unconsulted text after attempts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Current graph/resolution paths and checked inputs bound retained memo membership by active source population, with no separate numeric cap or watcher acquired by this interface.
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
   * @evidence contracts/common.md#principled-implementation Supplies published basis digest authority as an additional browser revision input because the resident code loads those bases.
   * @evidence contracts/common.md#clear-and-simple-design Keeps basis reading/digest ownership outside source import traversal while including its actual dependency in browser admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The basis string does not certify anatomical validity or cached geometry; missing/stale provider state cannot be replaced by a renderer observation.
   * @evidence contracts/common.md#meaningful-documentation Called during revision computation and each worker edit batch; face/body/person source digests stay separate from the browser basis contribution.
   * @evidence contracts/performance.md#efficient-algorithms Reading cost belongs to the basis owner; the revision owner hashes its supplied text together with browser graph authority.
   * @evidence contracts/performance.md#reuse-equivalent-work Published basis facts may be reused by their owner while source batches reread the current contribution before recomputation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a string without owning basis bytes or streams; source and sidecar readers retain those resources under their own lifetimes.
   */
  bases: () => string;

  /** File access: existence and text, undefined for an unreadable file. */
  io: IHumanViewerResolveIo & IHumanViewerRevisionReadIo;
}
