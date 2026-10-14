


/**
 * Recognize evidence row starts inside an admitted comment carrier.
 *
 * Wrapped-row parsing and structural-comment projection share this anchored native tag prefix. The parser decides carrier ownership; the regex recognizes syntax without judging prose quality or production subject matter.
 *
 * Matching inspects the row prefix, with time proportional to its matched prefix length and fixed pattern state. One module-owned regex is reused without retaining source buffers, project results or handles.
 *
 * @author Samchon
 */
export const ANNOTATION: RegExp = /^@evidence[A-Za-z]*\b/u;
