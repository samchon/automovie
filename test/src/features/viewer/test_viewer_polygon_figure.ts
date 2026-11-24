import type { IAutoMovieHumanSkeleton } from "@automovie/interface";
import { createAutoMovieHumanPolygonFigure } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";

import { createHumanPolygonFixture } from "../internal/createHumanPolygonFixture";

/**
 * The polygon figure rebuilds its face only on a changed head pose or
 * expression, and refuses placement once disposed.
 *
 * Scenarios:
 *
 * 1. Placing the same expression twice keeps one face object; a changed expression
 *    replaces it, and the head carries exactly one face.
 * 2. Disposal is once only and a later placement refuses.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places a real polygon figure on in-memory inputs and asserts its face objects and its refusal after disposal through 2 TestValidator.predicate calls. A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (face counts compared against literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 2 numbered scenarios, a held and a changed expression and a disposed figure, including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_viewer_polygon_figure`, which owns the cases delegated to `createHumanPolygonFixture`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Placing the same expression twice keeps one face object; a changed expression replaces it, and the head carries exactly one face.).
 */
export function test_viewer_polygon_figure(): void {
  const input: Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed"> =
    createHumanPolygonFixture();
  const figure: createAutoMovieHumanPolygonFigure.IFigure =
    createAutoMovieHumanPolygonFigure({ evaluate: () => input });
  const faces = (): THREE.Object3D[] =>
    figure.drawing.head.object.children.filter(
      (child: THREE.Object3D): boolean => child.type === "Group",
    );
  figure.place(input);
  const neutral: THREE.Object3D[] = faces();
  figure.place(input);
  const held: THREE.Object3D[] = faces();
  figure.place(input, undefined, {
    units: [{ unit: "lipCornerPuller", intensity: 0.3, side: "both" }],
  });
  const smiling: THREE.Object3D[] = faces();
  TestValidator.predicate(
    "face rebuilt only on change",
    neutral.length === 1 &&
      held.length === 1 &&
      held[0] === neutral[0] &&
      smiling.length === 1 &&
      smiling[0] !== neutral[0],
  );
  figure.dispose();
  figure.dispose();
  let refused: boolean = false;
  try {
    figure.place(input);
  } catch {
    refused = true;
  }
  TestValidator.predicate("disposed figure refuses", refused);
}
