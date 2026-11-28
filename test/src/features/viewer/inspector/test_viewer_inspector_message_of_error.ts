import {
  messageOfInspectorError
} from "../../../../../packages/viewer/src/inspector/internal/messageOfInspectorError";
import { TestValidator } from "@nestia/e2e";

/**
 * `messageOfInspectorError` words a thrown value.
 *
 * Scenarios:
 *
 * 1. An `Error` gives its message.
 * 2. Any other value gives its string form.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the operation displays an Error, text and a number.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the inspector's message reader with each literal thrown value and compares the returned text.
 * @evidence contracts/development/testing.md#independent-expectations An Error constructed with boom has message boom. The text late and the number seven have fixed display strings.
 */
export function test_viewer_inspector_message_of_error(): void {
  TestValidator.equals(
    "error",
    messageOfInspectorError(new Error("boom")),
    "boom",
  );
  TestValidator.equals("text", messageOfInspectorError("late"), "late");
  TestValidator.equals("number", messageOfInspectorError(7), "7");
}