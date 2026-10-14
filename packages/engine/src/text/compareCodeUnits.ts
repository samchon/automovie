
/**
 * Compare strings by locale-independent UTF-16 code-unit order.
 *
 * @evidence contracts/common.md#principled-implementation JavaScript string relational comparison yields a total lexicographic order over code units, with zero only for equal strings; this preserves distinct normalization forms without invoking host locale collation.
 * @evidence contracts/common.md#clear-and-simple-design The single scalar comparator serves canonical JSON, production inventories and engine ordering callers without an ICU-dependent alternative.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No case folding, normalization, locale collation or fixture order is substituted; callers must choose this byte-independent code-unit order when it matches their contract.
 * @evidence contracts/common.md#meaningful-documentation Documents exact equality and UTF-16 ordering, which is distinct from Unicode code-point or linguistic order.
 * @evidence contracts/performance.md#efficient-algorithms Work is bounded by the compared common prefix and string lengths, with constant additional storage and no key materialization.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers reuse the same comparator rather than copied locale-sensitive order rules; no comparison result is cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only -1, 0 or 1 escapes and input strings are not retained; no runtime locale object or external handle is acquired.
 * @author Samchon
 */
export const compareCodeUnits: (a: string, b: string) => number = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;
