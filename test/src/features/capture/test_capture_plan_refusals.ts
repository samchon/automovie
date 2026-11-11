import {
  type IAutoMovieCapturePlan,
  type IAutoMovieCaptureSubject,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/** A subject of four seconds at 30 fps with one named view, one object and one mark kind. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "duel",
  durationSeconds: 4,
  fps: 30,
  width: 640,
  height: 360,
  views: ["front"],
  drawables: [{ path: "hero", min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 2, z: 1 } }],
  marks: ["curve/section", "defect/open"],
};

/**
 * A plan refuses, before anything is drawn and naming the reason, every cell the subject cannot give.
 *
 * Scenarios:
 *
 * 1. A view the subject does not name is refused naming the view and listing the views it offers, with or without switches.
 * 2. `film`, a camera by coordinates and a named view the subject offers are planned.
 * 3. A `marks` pattern matching none of the subject's mark kinds is refused naming the pattern, and `curve/**` and `defect` are planned.
 * 4. A sweep matching no drawn object is refused naming the pattern.
 * 5. A sampling past the subject's end, an explicit second past it and an event past it are refused; the subject's last second itself is planned.
 * 6. A subject without a name or with a zero raster is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans requests the grammar accepts against a subject that cannot honour them and observes each refusal and its message; a planner that drew an empty selection, an unknown view or a time outside the subject fails.
 * @evidence contracts/development/testing.md#independent-expectations The refused values lie outside the hand-written subject (its one view, two mark kinds, one object and four seconds); the accepted controls lie inside it.
 * @evidence contracts/development/testing.md#distinguishing-cases Each refusal against the nearest accepted value: an unknown name against an offered one, a non-matching mark pattern against matching ones, the end second against one past it. Malformed text is owned by `test_capture_request_malformed_value`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_plan_refusals`; it plans in memory and draws nothing.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_plan_refusals(): void {
  const plan: (text: string, subject?: IAutoMovieCaptureSubject) => IAutoMovieCapturePlan = (
    text: string,
    subject: IAutoMovieCaptureSubject = SUBJECT,
  ): IAutoMovieCapturePlan =>
    planAutoMovieCapture({
      request: parseAutoMovieCapturePlanRequest(new URLSearchParams(text)),
      subject,
      cuts: [],
    });
  const refuses: (text: string, fragments: string[], subject?: IAutoMovieCaptureSubject) => boolean = (text: string, fragments: string[], subject?: IAutoMovieCaptureSubject): boolean =>
    throwsError((): unknown => plan(text, subject), fragments);

  // 1. Views the subject does not name.
  TestValidator.predicate("an unknown view is refused", refuses("at=1&views=side", ['"side"', "front"]));
  TestValidator.predicate(
    "an unknown view with switches is refused",
    refuses("at=1&views=front;back@ortho", ['"back"']),
  );

  // 2. Views every subject can be drawn through.
  TestValidator.equals(
    "film, coordinates and an offered name are planned",
    plan("at=1&views=film;0,1,4:0,1,0;front@focus=hero").cells.length,
    3,
  );

  // 3. Mark kinds.
  TestValidator.predicate(
    "a mark pattern matching no kind is refused",
    refuses("at=1&marks=joint/**", ['"joint/**"', "curve/section"]),
  );
  TestValidator.equals(
    "matching mark patterns are planned",
    plan("at=1&marks=curve/**,defect").cells.length,
    1,
  );

  // 4. Sweeps.
  TestValidator.predicate("a sweep matching nothing is refused", refuses("at=1&sweep=lamp", ['"lamp"']));

  // 5. Times.
  TestValidator.predicate("a sampling past the end is refused", refuses("from=1&to=5", ["5"]));
  TestValidator.predicate("a second past the end is refused", refuses("at=4.5", ["4.5"]));
  TestValidator.predicate("an event past the end is refused", refuses("events=4.01", ["4.01"]));
  TestValidator.equals("the last second is planned", plan("at=4").cells.length, 1);

  // 6. Subjects.
  TestValidator.predicate(
    "a subject without a name is refused",
    refuses("at=1", ["name"], { ...SUBJECT, name: " " }),
  );
  TestValidator.predicate(
    "a zero raster is refused",
    refuses("at=1", ["0x360"], { ...SUBJECT, width: 0 }),
  );
}
