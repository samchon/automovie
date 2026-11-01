import { assertHumanCurves } from "../internal/assertHumanCurves";

/** The arms and their joins are sound curves, on every person. */
export const test_human_curve_arm = (): void =>
  assertHumanCurves(/^arm\./);
