import { TestValidator } from "@nestia/e2e";

import { bodyPoseCensusRefusalMessage } from "../../../scripts/body-basis/bodyPoseCensusRefusalMessage";

/**
 * Refusal text preserves a builder's cause and handles foreign failure values.
 *
 * Scenarios:
 * 1. Error and RangeError retain their complete message without mutation.
 * 2. A string or primitive foreign failure has its ordinary explicit text;
 *    these values are supplied to the converter and are never thrown by tests.
 */
export const test_human_body_census_refusal_message = (): void => {
  for (const error of [new Error("joint range"), new RangeError("body bounds")]) {
    const message = error.message;
    TestValidator.equals("an Error retains its cause", bodyPoseCensusRefusalMessage(error), message);
    TestValidator.equals("the Error is not mutated", error.message, message);
  }
  TestValidator.equals("foreign string cause", bodyPoseCensusRefusalMessage("foreign failure"), "foreign failure");
  TestValidator.equals("foreign primitive cause", bodyPoseCensusRefusalMessage(42), "42");
};
