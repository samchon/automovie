import { assertHumanCurves } from "../internal/assertHumanCurves";

/** The trunk and shoulders and their joins are sound curves, on every person. */
export const test_human_curve_trunk = (): void =>
  assertHumanCurves(/^(trunk|upper)$/);
