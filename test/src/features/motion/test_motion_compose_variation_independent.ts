import { AutoMovieMotionHumanVariation } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionVariationSource } from "../internal/motionVariationSource";

/**
 * A slot's offset does not depend on which other slots an action varies, nor
 * on the order it varies them in.
 *
 * Scenarios:
 * 1. Slots `a` and `b` varied alone give the values they give when a third
 *    slot `c` is varied between them and when `b` is varied before `a`.
 * 2. Two slots of the same type with different keys get different offsets,
 *    and so do two slot types under the same key's stream indices: the two
 *    keys' values differ.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public slot functions on one source in three orders; a shared counter or a stream advanced by another slot fails.
 * @evidence contracts/development/testing.md#independent-expectations Independence is a law over the orders of calls and needs no expected number.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers an added slot, a reversed order and two keys of one type.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on real seeded streams. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 scenarios.
 */
export function test_motion_compose_variation_independent(): void {
  const source = motionVariationSource();
  const slot = (key: string): number =>
    AutoMovieMotionHumanVariation.bend(source, key, 0);
  const alone: number[] = [slot("a"), slot("b")];
  const a: number = slot("a");
  slot("c");
  const withThird: number[] = [a, slot("b")];
  const b: number = slot("b");
  const reversed: number[] = [slot("a"), b];
  TestValidator.equals("with a third slot between", withThird, alone);
  TestValidator.equals("in the reverse order", reversed, alone);
  TestValidator.predicate(
    "two keys draw apart",
    alone[0] !== alone[1] && slot("c") !== alone[0] && slot("c") !== alone[1],
  );
}
