import type { IAutoMovieReferenceRange } from "./IAutoMovieReferenceRange";
import type { IAutoMovieReferenceHeading } from "./IAutoMovieReferenceHeading";
import type { IAutoMovieReferenceFileIndex } from "./IAutoMovieReferenceFileIndex";


/**
 * An exact comment-free file or subtree view, optionally retaining its piece map.
 *
 * @evidence contracts/common.md#principled-implementation One selected original interval produces comment-free text whose byte count and optional retained/omitted ranges refer to the same source revision.
 * @evidence contracts/common.md#clear-and-simple-design Whole-file and subtree views share a result with null heading distinguishing the whole file.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Projection removes recognized comments without normalizing remaining source or fabricating a summary.
 * @evidence contracts/common.md#meaningful-documentation Members state source/content byte units, original intervals and detail=true piece-map ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-held values retain only their documented fields; implementations own handles and source-lifetime bounds.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceContent {

  /** Canonical project-relative identity of the source read for this projection. */
  file: string;

  /** SHA-256 of the same source snapshot that supplies the content and ranges. */
  revision: string;

  /** Original file byte count before annotation removal or section selection. */
  sourceBytes: number;

  /** UTF-8 byte count of content alone, distinct from the serialized response budget. */
  contentBytes: number;

  /** Selected original file or subtree body interval, before comment omission. */
  range: IAutoMovieReferenceRange;

  /** Selected section heading metadata; null for a whole-file read. */
  heading: IAutoMovieReferenceHeading | null;

  /** Ordered original source slices with only recognized HTML comments omitted. */
  content: string;

  /** Unterminated-comment notices intersecting the selected original interval. */
  diagnostics: IAutoMovieReferenceFileIndex["diagnostics"];

  /** Present only for detail=true, so ordinary reference responses stay compact. */
  projection?: {

    /** Ordered retained source spans whose concatenation exactly reconstructs content. */
    contentRanges: IAutoMovieReferenceRange[];

    /** Omitted comment spans clipped to the selected source interval. */
    annotationRanges: IAutoMovieReferenceRange[];
  };
}
