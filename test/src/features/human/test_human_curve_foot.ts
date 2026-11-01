import { assertHumanCurves } from "../internal/assertHumanCurves";

/** The feet and their joins are sound curves, on every person. */
export const test_human_curve_foot = (): void =>
  assertHumanCurves(/^(foot|forefoot|toe)\./);
