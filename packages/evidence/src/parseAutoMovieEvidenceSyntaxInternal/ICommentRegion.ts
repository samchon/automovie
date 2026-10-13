


/**
 * One original HTML comment span and its closure state.
 *
 * @evidence contracts/common.md#principled-implementation Original offsets, opening line, body text and closure state describe one syntactic HTML comment interval.
 * @evidence contracts/common.md#clear-and-simple-design An internal region value supports both projection and annotation extraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unterminated comments remain explicit closed:false and cannot become completed carriers.
 * @evidence contracts/common.md#meaningful-documentation Members document original UTF-16 interval, starting line and closure state.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased comment-span shape acquires no source or handle; markdownCommentRegions creates offset/text rows retained by its projection or carrier-parser caller for that document.
 *
 *
 * @author Samchon
 */
export interface ICommentRegion {
  /** Whether the original source contains this comment's closing marker. */
  closed: boolean;

  /** Exclusive original UTF-16 end offset, including a closing marker when present. */
  end: number;

  /** One-based original source line containing the opening marker. */
  line: number;

  /** Inclusive original UTF-16 offset of the opening marker. */
  start: number;

  /** Original comment body without its opening and closing marker bytes. */
  text: string;
}
