import { TestValidator } from "@nestia/e2e";

import { LexiconAbsentNet } from "../internal/LexiconAbsentNet";

/**
 * Missing lexicon input reaches the schema for each row.
 *
 * Scenarios:
 * 1. Input rejected at the schema entry produces a diagnostic naming the parameter.
 * 2. A law that receives the input can plan or give a named refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which invalid input the test owns and where it is handled.
 * @evidence contracts/development/testing.md#behavioral-verification Invokes the real parameter gate and plans any remaining request that reaches the law. A raw exception, empty axis or literal undefined in the explanation fails.
 * @evidence contracts/development/testing.md#independent-expectations A required parameter either produces a named HumanRefusal before planning or the plan can safely handle its omission, as required by the public grammar.
 * @evidence contracts/development/testing.md#distinguishing-cases Rows already planned with exactly these bare parameters by the positive row tests contribute only shape admission here.
 * @evidence contracts/development/testing.md#execution-ownership Runs the in-memory public gate and, for law-specific outcomes, the normal registered chain on prepared fixtures.
 */
export function test_human_motion_lexicon_absent_defaults(): void {
  TestValidator.equals(
    "the grammar handles defaults with a result or a named refusal",
    LexiconAbsentNet.bare(),
    [],
  );
}
