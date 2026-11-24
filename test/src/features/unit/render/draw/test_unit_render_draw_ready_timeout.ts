import type {
  IAutoMovieCapturePlan,
  IAutoMovieCaptureSubject,
} from "@automovie/interface";
import {
  AutoMovieDrawSession,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { answerDrawCall } from "./answerDrawCall";
import { createDrawPageDouble } from "./createDrawPageDouble";

/** A subject of two seconds at 10 fps, drawn 16 by 16. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "stall",
  durationSeconds: 2,
  fps: 10,
  width: 16,
  height: 16,
  views: [],
  drawables: [],
  marks: [],
};

/**
 * A subject that never reports ready fails the cell it was drawing after the session's stated timeout, with an error naming the cell, instead of holding the host.
 *
 * Scenarios:
 *
 * 1. With a page whose draw never settles and a timeout of 40 ms, drawing the cell `t001.000-film-beauty` rejects within a second, naming the cell and the 0.04 s timeout.
 * 2. A delivery frame on the same page rejects naming its second and pass.
 * 3. A page that answers draws the same cell without delay, so the bound does not refuse a ready subject.
 */
export async function test_unit_render_draw_ready_timeout(): Promise<void> {
  const plan: (session: AutoMovieDrawSession) => IAutoMovieCapturePlan = (
    session: AutoMovieDrawSession,
  ): IAutoMovieCapturePlan =>
    planAutoMovieCapture({
      request: parseAutoMovieCapturePlanRequest(new URLSearchParams("at=1")),
      subject: session.subject,
      cuts: [],
    });
  const open: (
    answer: Parameters<typeof createDrawPageDouble>[0]["answer"],
  ) => Promise<AutoMovieDrawSession> = (
    answer: Parameters<typeof createDrawPageDouble>[0]["answer"],
  ): Promise<AutoMovieDrawSession> =>
    AutoMovieDrawSession.open({
      page: createDrawPageDouble({ subject: SUBJECT, renderer: "test", answer })
        .page,
      url: "http://127.0.0.1:1/index.html",
      props: { subject: null, props: null },
      backend: "swiftshader",
      timeout: 40,
    });

  // 1. A cell that never finishes.
  const stalled: AutoMovieDrawSession = await open(null);
  const planned: IAutoMovieCapturePlan = plan(stalled);
  const started: number = Date.now();
  const message: string = await stalled
    .drawing(planned.cells[0]!, planned)
    .then((): string => "")
    .catch((error: unknown): string =>
      error instanceof Error ? error.message : String(error),
    );
  TestValidator.predicate(
    "the cell is named",
    message.includes("Cell t001.000-film-beauty"),
  );
  TestValidator.predicate("the timeout is stated", message.includes("0.04 s"));
  TestValidator.predicate(
    "it rejects within a second",
    Date.now() - started < 1000,
  );

  // 2. A delivery frame that never finishes.
  const frame: string = await stalled
    .frame(1, ["beauty"])
    .then((): string => "")
    .catch((error: unknown): string =>
      error instanceof Error ? error.message : String(error),
    );
  TestValidator.predicate(
    "the frame's second and pass are named",
    frame.includes("1 s in pass beauty"),
  );

  // 3. A ready subject.
  const ready: AutoMovieDrawSession = await open(answerDrawCall);
  const again: IAutoMovieCapturePlan = plan(ready);
  TestValidator.equals(
    "a ready subject draws",
    (await ready.drawing(again.cells[0]!, again)).picture.width,
    16,
  );
}
