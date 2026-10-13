/**
 * Whether a string can be written verbatim as a WebVTT cue identifier or
 * header text.
 *
 * WebVTT defines no escape for these lines, so a usable value is one or more
 * characters with no CR, no LF, and no `-->`, which a parser would read as a
 * line break or a cue timing line. An empty string is refused because an empty
 * identifier line is a blank line, which drops the cue's id; header text shares
 * the rule, which costs nothing because production design refuses a blank
 * production id. Film assembly additionally refuses whitespace-only cue ids as
 * a product rule.
 *
 * @evidence contracts/common.md#principled-implementation The predicate is the W3C WebVTT cue identifier production, one or more characters excluding line terminators and the substring `-->`, checked with a length test, one regular expression and one substring search; header text is held to the same production although WebVTT would accept it empty.
 * @evidence contracts/common.md#clear-and-simple-design A pure predicate lets film assembly report a diagnostic while `serializeAutoMovieWebVttIdentifier` throws, both from the one rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every refused shape comes from the WebVTT grammar; the stricter blank-id rule stays in film assembly, which owns it, instead of being folded in here.
 * @evidence contracts/common.md#meaningful-documentation The doc lists the refused shapes, why each breaks the file, and which stricter rule a caller adds.
 * @evidence contracts/performance.md#efficient-algorithms Both checks are linear scans of the identifier, O(L) with no allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A stateless predicate over one string has no completed work to share across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The predicate retains nothing and opens no handle or task.
 */
export const isAutoMovieWebVttIdentifier = (value: string): boolean =>
  value.length > 0 &&
  /[\r\n]/u.test(value) === false &&
  value.includes("-->") === false;
