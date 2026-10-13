import type { IAutoMovieReferenceHeading, IAutoMovieReferenceRange } from "../structures/IAutoMovieReference";

/**
 * Original UTF-16 source span with an exclusive end.
 *
 * @author Samchon
 */
interface Interval {
  /** Inclusive original UTF-16 offset. */
  start: number;

  /** Exclusive original UTF-16 offset. */
  end: number;
}

/**
 * Parsed heading positions delimiting its own body and descendant subtree.
 *
 * @author Samchon
 */
interface Heading extends IAutoMovieReferenceHeading {
  /** Offset after the selected heading's own final newline. */
  bodyStart: number;

  /** Start of the next same-or-shallower heading, or EOF. */
  subtreeEnd: number;
}

/**
 * The single source snapshot shared by navigation and content projection.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-source Keeps revision, syntax and original characters together for one read.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-source Retains the original source plus only positional syntax needed for lossless projection.
 * @author Samchon
 */
export interface ParsedReference {
  /** Fatal UTF-8 decode of the original bytes, including any BOM. */
  source: string;

  /** Canonical project-relative identity associated with these source bytes. */
  file: string;

  /** SHA-256 captured before asynchronous syntax loading can observe mutable input. */
  revision: string;

  /** Original byte count captured beside the source revision. */
  sourceBytes: number;

  /** All top-level headings, including unsupported depths needed for subtree boundaries. */
  headings: Heading[];

  /** Ordered intervals recognized as actual HTML comments, never comment-like code. */
  annotations: Interval[];

  /** Annotation intervals lacking a closing marker, retained only for diagnostics. */
  unterminated: Interval[];

  /** Resolve an original interval into line and UTF-16 coordinates for this snapshot. */
  range(interval: Interval): IAutoMovieReferenceRange;
}
