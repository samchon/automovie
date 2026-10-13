import type { AutoMovieAuthoredDocumentLayer } from "@automovie/evidence";
import type { IAutoMovieReferenceFileIndex } from "./IAutoMovieReferenceFileIndex";


/**
 * A bounded layer page tied to a digest of its ordered file snapshots.
 *
 * @evidence contracts/common.md#principled-implementation An ordered observed file population supplies a revision and offset continuation without asserting atomic cross-file reads.
 * @evidence contracts/common.md#clear-and-simple-design One bounded page separates total population size from current page length.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The literal atomic:false prevents current separate reads from claiming a repository snapshot.
 * @evidence contracts/common.md#meaningful-documentation Members state complete total, UTF-16 path ordering and next-offset revision binding.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased page type holds no source population itself; createAutoMovieReferenceProvider returns at most one admitted page of file indices and a continuation to its caller, while copied source snapshots remain request-local.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceLayerIndex {

  /** The single authored Markdown family requested from the shared layer inventory. */
  layer: AutoMovieAuthoredDocumentLayer;

  /** Digest of ordered file paths and per-file source revisions observed by this request. */
  revision: string;

  /** Always false: separately read files do not form an atomic repository snapshot. */
  atomic: false;

  /** Complete admitted layer file count, not merely this page's length. */
  total: number;

  /** Whole compact file indices on this page in UTF-16 path order. */
  files: IAutoMovieReferenceFileIndex[];

  /** Next unread file offset on this same layer revision, or null at the end. */
  continuation: {

    /** Layer revision that must still match when the next page is requested. */
    revision: string;

    /** Zero-based ordinal of the next unread file in the complete sorted inventory. */
    offset: number;
  } | null;
}
