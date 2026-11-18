import { TestValidator } from "@nestia/e2e";

import { LexiconAbsentNet } from "../internal/LexiconAbsentNet";

/**
 * A region unknown to the current body reaches the same authored row input path.
 *
 * Scenarios:
 * 1. Input rejected at the schema entry produces a diagnostic naming the parameter.
 * 2. A law that receives the input can plan or give a named refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which invalid input the test owns and where it is handled.
 * @evidence contracts/development/testing.md#behavioral-verification Invokes the real parameter gate and plans any remaining request that reaches the law. A raw exception, empty axis or literal undefined in the explanation fails.
 * @evidence contracts/development/testing.md#independent-expectations An invalid region is rejected as a named HumanRefusal or safely left unresolved by a law that accepts it, as required by the public grammar.
 * @evidence contracts/development/testing.md#distinguishing-cases The body and partner fixtures stay the same during the only mutation, which replaces authored region strings.
 * @evidence contracts/development/testing.md#execution-ownership Runs the in-memory public gate and, for law-specific outcomes, the normal registered chain on prepared fixtures.
 */
export function test_human_motion_lexicon_absent_regions(): void {
  TestValidator.equals(
    "the grammar handles regions with a result or a named refusal",
    LexiconAbsentNet.regions(),
    [],
  );
}
