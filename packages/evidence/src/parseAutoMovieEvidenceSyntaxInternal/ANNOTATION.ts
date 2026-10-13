


/**
 * Its role is limited to evidence tag starts, with carrier ownership decided by the parser.
 *
 * An anchored structural tag prefix identifies native evidence row starts within an already admitted comment carrier.
 * One fixed token recognizer serves wrapped-row parsing and structural-comment projection.
 * This regex recognizes syntax only and never judges prose quality or production subject matter.
 * Its role is limited to evidence tag starts, with carrier ownership decided by the parser.
 * Matching one line prefix is O(prefix length) and retains fixed regex state.
 * Both carrier helpers share the same structural tag grammar.
 * Only a module-owned pattern persists without source buffers or handles.
 *
 * @author Samchon
 */
export const ANNOTATION: RegExp = /^@evidence[A-Za-z]*\b/u;
