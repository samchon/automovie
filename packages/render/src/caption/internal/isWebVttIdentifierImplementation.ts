/*
 * Whether a string can be written verbatim as a WebVTT cue identifier or header
 * text.
 *
 * WebVTT defines no escape for these lines, so a usable value is one or more
 * characters with no CR, no LF, and no `-->`, which a parser would read as a
 * line break or a cue timing line. An empty string is refused because an empty
 * identifier line is a blank line, which drops the cue's id; header text shares
 * the rule, which costs nothing because production design refuses a blank
 * production id. Film assembly additionally refuses whitespace-only cue ids as
 * a product rule.
 */
export const isWebVttIdentifierImplementation: (value: string) => boolean = (
  value: string,
): boolean =>
  value.length > 0 &&
  /[\r\n]/u.test(value) === false &&
  value.includes("-->") === false;
