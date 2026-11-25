import { messageOfAutoMovieInspectorError } from "@automovie/viewer/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `messageOfAutoMovieInspectorError` words a thrown value.
 *
 * Scenarios:
 *
 * 1. An `Error` gives its message.
 * 2. Any other value gives its string form.
 */
export function test_viewer_inspector_message_of_error(): void {
  TestValidator.equals(
    "error",
    messageOfAutoMovieInspectorError(new Error("boom")),
    "boom",
  );
  TestValidator.equals("text", messageOfAutoMovieInspectorError("late"), "late");
  TestValidator.equals("number", messageOfAutoMovieInspectorError(7), "7");
}