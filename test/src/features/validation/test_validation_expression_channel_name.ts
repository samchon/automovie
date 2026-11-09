import { validateExpressionResult } from "@automovie/engine";
import {
  AutoMovieArkitChannel,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeExpression } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Reject a forged blendshape channel despite its valid numerical weight.
 *
 * Scenarios:
 * 1. Unknown jawWide with weight 0.5 fails with a type finding on channel.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual expression admission with a forged channel and reads failed success plus its located type finding, catching a validator that only checks weight.
 * @evidence contracts/development/testing.md#independent-expectations jawWide is outside the closed ARKit channel menu while 0.5 is in range, so the expected failure names channel rather than weight; no implementation-produced report supplies the expected address.
 * @evidence contracts/development/testing.md#distinguishing-cases Owns unknown-channel refusal with otherwise valid preset/intensity/weight; known-channel acceptance, duplicate names and scalar failures have separate entries.
 * @evidence contracts/development/testing.md#execution-ownership The named synchronous unit uses the existing expression fixture and actual engine result without a morph renderer, process or native artifact.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 1 numbered scenario it runs, each sentence naming the input and the behavior it pins (first: Unknown jawWide with weight 0.5 fails with a type finding on channel.).
 */
export function test_validation_expression_channel_name(): void {
  const result: IAutoMovieValidation = validateExpressionResult(
    makeExpression("neutral", 0.5, [
      { channel: "jawWide" as AutoMovieArkitChannel, weight: 0.5 },
    ]),
  );

  TestValidator.equals("unknown channel fails", result.success, false);
  TestValidator.predicate(
    "channel type violation",
    hasViolation(result, "type", ".channel"),
  );
}
