import {
  type IAutoMovieInspectorState,
  createAutoMovieInspectorState,
  readAutoMovieInspectorAddress,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `createAutoMovieInspectorState` reads an address into the opening state; text
 * that does not read opens on the empty request with its refusal.
 *
 * Scenarios:
 *
 * 1. "at=1&parts=a" opens on that request with no error.
 * 2. "colour=1" opens on the empty request with an error.
 */
export function test_viewer_inspector_create_state(): void {
  TestValidator.equals(
    "a readable address",
    createAutoMovieInspectorState("at=1&parts=a"),
    { request: readAutoMovieInspectorAddress("at=1&parts=a"), error: null },
  );
  const refused: IAutoMovieInspectorState =
    createAutoMovieInspectorState("colour=1");
  TestValidator.predicate(
    "an unreadable address",
    JSON.stringify(refused.request) ===
      JSON.stringify(readAutoMovieInspectorAddress("")) &&
      refused.error !== null &&
      refused.error.includes("colour"),
  );
}
