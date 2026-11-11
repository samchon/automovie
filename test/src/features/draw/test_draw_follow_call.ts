import {
  type IAutoMovieCaptureCell,
  type IAutoMovieCapturePlan,
  type IAutoMovieCaptureSubject,
  type IAutoMovieDrawCall,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  planAutoMovieDrawCall,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/** A subject of four seconds at 10 fps, drawn 48 by 30, offering the named viewpoint `side`. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "walk",
  durationSeconds: 4,
  fps: 10,
  width: 48,
  height: 30,
  views: ["side"],
  drawables: [],
  marks: [],
};

/**
 * A view with `@follow` is framed at each cell's own second, while the same view without it is framed over every second the capture plans, so a travelling subject stays large when followed and keeps one camera across times otherwise.
 *
 * Scenarios:
 *
 * 1. Seconds 1, 2 and 3 through `side@follow` and `side` plan six cells; each `side@follow` call frames only its cell's second, and each `side` call frames all three planned seconds.
 * 2. A followed view keeps its other switches: `side@ortho@follow@focus=hero` frames its cell's second, and its view text reaches the page unchanged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans cells with the public grammar and planner and turns each into the page call with the public call planner, then reads the framing span; a planner that framed a followed view over every second, or a plain view on one, fails.
 * @evidence contracts/development/testing.md#independent-expectations The planned seconds are the ones this test asks for, and the followed span is the cell's own second, as the view grammar documents `@follow`.
 * @evidence contracts/development/testing.md#distinguishing-cases A followed view against the same view without the switch, and a followed view with other switches. How a view resolves is owned by `test_inspection_view_repeat`; the draw page's framing itself needs a browser and is observed in captures.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_follow_call`; it plans in memory and starts no browser.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_follow_call(): void {
  const calls: (text: string) => [IAutoMovieCaptureCell, IAutoMovieDrawCall][] = (
    text: string,
  ): [IAutoMovieCaptureCell, IAutoMovieDrawCall][] => {
    const plan: IAutoMovieCapturePlan = planAutoMovieCapture({
      request: parseAutoMovieCapturePlanRequest(new URLSearchParams(text)),
      subject: SUBJECT,
      cuts: [],
    });
    return plan.cells.map((cell: IAutoMovieCaptureCell): [IAutoMovieCaptureCell, IAutoMovieDrawCall] => [
      cell,
      planAutoMovieDrawCall(cell, plan),
    ]);
  };

  // 1. Followed against plain.
  TestValidator.equals(
    "a followed view frames its own second, a plain one every second",
    calls("at=1,2,3&views=side@follow;side").map(
      ([cell, call]: [IAutoMovieCaptureCell, IAutoMovieDrawCall]): [string, number[]] => [cell.view, call.frame],
    ),
    [
      ["side@follow", [1]],
      ["side", [1, 2, 3]],
      ["side@follow", [2]],
      ["side", [1, 2, 3]],
      ["side@follow", [3]],
      ["side", [1, 2, 3]],
    ],
  );

  // 2. Other switches stay.
  const [cell, call]: [IAutoMovieCaptureCell, IAutoMovieDrawCall] = calls("at=2,3&views=side@ortho@follow@focus=hero")[1]!;
  TestValidator.equals("a followed view with other switches", [call.view, call.frame], [cell.view, [3]]);
}
