import { assertHumanDetailBoundary } from "../internal/assertHumanDetailBoundary";

/**
 * Every advertised scalar lower endpoint is inclusive in document editing.
 *
 * Scenarios:
 * 1. Each minimum is stored exactly at its declared detail path.
 * 2. An adjacent value below the minimum and NaN both refuse.
 * 3. Successful and refused edits leave the input document unchanged.
 */
export const test_subject_human_detail_lower_limits = (): void => {
  assertHumanDetailBoundary("minimum", -0.01, NaN);
};
