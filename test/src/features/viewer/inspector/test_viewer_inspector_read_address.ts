import { AutoMovieViewerInspector } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieViewerInspector.readAddress` reads an address's query text, with or
 * without its leading `?`, and refuses a key it does not know.
 *
 * Scenarios:
 *
 * 1. "?at=1" and "at=1" read the same request.
 * 2. "colour=1" is refused naming "colour"; "views=" naming "views".
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names optional query punctuation and the error cases.
 * @evidence contracts/development/testing.md#behavioral-verification Reads two equivalent query strings and calls the reader with an unknown key and an empty view, checking the keyed refusal.
 * @evidence contracts/development/testing.md#independent-expectations A leading question mark is URL punctuation. An unknown colour key and a view without a value are independent invalid requests.
 */
export function test_viewer_inspector_read_address(): void {
  TestValidator.equals(
    "a leading ?",
    AutoMovieViewerInspector.readAddress("?at=1"),
    AutoMovieViewerInspector.readAddress("at=1"),
  );
  for (const [text, key] of [
    ["colour=1", "colour"],
    ["views=", "views"],
  ] as const)
    TestValidator.error(`${text} is refused`, (): unknown => {
      try {
        return AutoMovieViewerInspector.readAddress(text);
      } catch (error) {
        if (error instanceof Error && error.message.includes(key)) throw error;
        return undefined;
      }
    });
}
