import { assertHumanCurves } from "../internal/assertHumanCurves";

/** The legs and their joins are sound curves, on every person. */
export const test_human_curve_leg = (): void =>
  assertHumanCurves(/^leg\./);
