import {
  AutoMovieViewerInspector,
  type IAutoMovieViewerInspectorState,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieViewerInspector.createState` reads an address into the opening state; text
 * that does not read opens on the empty request with its refusal.
 *
 * Scenarios:
 *
 * 1. "at=1&parts=a" opens on that request with no error.
 * 2. "colour=1" opens on the empty request with an error.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the valid opening address and the default state after refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the state constructor with literal address text and checks the returned request and error.
 * @evidence contracts/development/testing.md#independent-expectations The address requests second one and path a. The ordinary address reader provides the comparison request, while a separately invalid colour key independently requires a refusal and the empty request.
 */
export function test_viewer_inspector_create_state(): void {
  TestValidator.equals(
    "a readable address",
    AutoMovieViewerInspector.createState("at=1&parts=a"),
    { request: AutoMovieViewerInspector.readAddress("at=1&parts=a"), error: null },
  );
  const refused: IAutoMovieViewerInspectorState =
    AutoMovieViewerInspector.createState("colour=1");
  TestValidator.predicate(
    "an unreadable address",
    JSON.stringify(refused.request) ===
      JSON.stringify(AutoMovieViewerInspector.readAddress("")) &&
      refused.error !== null &&
      refused.error.includes("colour"),
  );
}
