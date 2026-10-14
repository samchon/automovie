import { productionRepaintRawExactInstant } from "./productionRepaintRawExactInstant";

/**
 * Convert raw retention-time admission into a boolean, returning false for parse/format failures without retaining their exception.
 *
 * @evidence contracts/common.md#principled-implementation The throwing exact-UTC roundtrip owner supplies the same policy as planning, with a narrow exception-to-false boundary for stored receipt checks.
 * @evidence contracts/common.md#clear-and-simple-design Time parsing stays with one assertion while this wrapper exposes refusal as a metadata predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed or noncanonical time is not replaced by the current clock or a default instant.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies false-on-failure and the lack of retained diagnostic state.
 * @evidence contracts/performance.md#efficient-algorithms The wrapper adds constant comparison/exception work to one Date parse and ISO formatting, without a second timestamp pass.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each current receipt time is read independently and no prior admission cache is owned.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Neither caught exception nor Date escapes, and only a boolean returns without a timer or handle.
 */
export const productionRepaintRawIsExactInstant: (value: string) => boolean = (value: string): boolean => {
  try {
    return productionRepaintRawExactInstant(value) === value;
  } catch {
    return false;
  }
};
