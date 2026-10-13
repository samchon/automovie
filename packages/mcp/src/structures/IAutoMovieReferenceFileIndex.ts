import type { IAutoMovieReferenceRange } from "./IAutoMovieReferenceRange";
import type { IAutoMovieReferenceHeading } from "./IAutoMovieReferenceHeading";


/**
 * One file's compact current-source navigation result.
 *
 * @evidence contracts/common.md#principled-implementation One current-source byte revision binds compact heading navigation and original ranges.
 * @evidence contracts/common.md#clear-and-simple-design Navigation excludes body text and per-comment arrays while retaining location-only parse notices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only an actual H1 supplies title; revision represents exact bytes rather than a filename or watcher state.
 * @evidence contracts/common.md#meaningful-documentation Members state canonical identity, byte extent, headings and unterminated annotation diagnostics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased navigation schema allocates no inventory; indexReference returns titles, revisions and coordinate records whose lifetime belongs to the response caller, without the parsed source body's resolver closure or a descriptor.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceFileIndex {

  /** Canonical docs/<authored-layer>/...md identity relative to the bound production. */
  file: string;

  /** SHA-256 of the exact UTF-8 source bytes represented by this index. */
  revision: string;

  /** Original byte count, including annotations and an optional UTF-8 BOM. */
  sourceBytes: number;

  /** First actual H1 title, or null; a filename is never promoted to a title. */
  title: string | null;

  /** Entire original decoded file span, including comments hidden from projections. */
  range: IAutoMovieReferenceRange;

  /** Compact H2/H3/H4 entries in original source order, without body text. */
  headings: IAutoMovieReferenceHeading[];

  /** Location-only notices; annotation contents are never diagnostic messages. */
  diagnostics: {

    /** The recognized block comment remains open through EOF. */
    code: "UNTERMINATED_ANNOTATION";

    /** Full original unterminated comment interval. */
    range: IAutoMovieReferenceRange;
  }[];
}
