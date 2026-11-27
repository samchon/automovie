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