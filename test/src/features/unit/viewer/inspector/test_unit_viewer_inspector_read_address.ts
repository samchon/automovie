import { readAutoMovieInspectorAddress } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `readAutoMovieInspectorAddress` reads an address's query text, with or
 * without its leading `?`, and refuses a key it does not know.
 *
 * Scenarios:
 *
 * 1. "?at=1" and "at=1" read the same request.
 * 2. "colour=1" is refused naming "colour"; "views=" naming "views".
 */
export function test_unit_viewer_inspector_read_address(): void {
  TestValidator.equals(
    "a leading ?",
    readAutoMovieInspectorAddress("?at=1"),
    readAutoMovieInspectorAddress("at=1"),
  );
  for (const [text, key] of [
    ["colour=1", "colour"],
    ["views=", "views"],
  ] as const)
    TestValidator.error(`${text} is refused`, (): unknown => {
      try {
        return readAutoMovieInspectorAddress(text);
      } catch (error) {
        if (error instanceof Error && error.message.includes(key)) throw error;
        return undefined;
      }
    });
}
