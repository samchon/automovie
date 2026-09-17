import { assertHumanDetailBoundary } from "../internal/assertHumanDetailBoundary";

/**
 * Every advertised scalar upper endpoint is inclusive in document editing.
 *
 * Scenarios:
 * 1. Each maximum is stored exactly at its declared detail path.
 * 2. An adjacent value above the maximum and Infinity both refuse.
 * 3. Successful and refused edits leave the input document unchanged.
 */
export const test_subject_human_detail_upper_limits = (): void => {
  assertHumanDetailBoundary("maximum", 0.01, Infinity);
};
