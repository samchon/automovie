import type { IAutoMovieReferenceHeading, IAutoMovieReferenceRange } from "../structures/IAutoMovieReference";

/**
 * Original UTF-16 source span with an exclusive end.
 *
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
 * @evidence contracts/common.md#principled-implementation One fatal-decoded source snapshot binds digest, original byte extent, headings and ordered comment intervals.
 * @evidence contracts/common.md#clear-and-simple-design Private body/subtree offsets and one range resolver serve both navigation and content projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest is captured before asynchronous syntax work and comment spans come from actual native syntax.
 * @evidence contracts/common.md#meaningful-documentation Members state original UTF-16 positions, source revision and coordinate ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-held values retain only their documented fields; implementations own handles and source-lifetime bounds.
 *
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

  /** Resolve an original interval into line and UTF-16 coordinates for this snapshot.
   *
   * @evidence contracts/common.md#principled-implementation Original UTF-16 endpoints resolve to one-based coordinates within this same parsed source snapshot.
   * @evidence contracts/common.md#clear-and-simple-design One coordinate capability is shared by navigation, content pieces and annotation notices.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No regenerated edition offset is presented as a canonical source address.
   * @evidence contracts/common.md#meaningful-documentation The member states original interval resolution and source-coordinate meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The resolver closure retains snapshot line starts while the parsed result lives; returned ranges contain scalar coordinates only.
   */
  range(interval: Interval): IAutoMovieReferenceRange;
}
