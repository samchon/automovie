import { assertHumanCurves } from "../internal/assertHumanCurves";

/** The hands and their joins are sound curves, on every person. */
export const test_human_curve_hand = (): void =>
  assertHumanCurves(/^(hand|finger|thumb)\./);
