import type {
  IAutoMovieCaptureSubject,
  IAutoMovieDeliveredCutEntry,
  IAutoMovieDrawnVideoResult,
  IAutoMovieRenderSpec,
} from "@automovie/interface";
import {
  AutoMovieDrawSession,
  renderAutoMovieDrawnVideo,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { answerDrawCall } from "./answerDrawCall";
import { createDrawPageDouble } from "./createDrawPageDouble";

/** Encoding controls shared by every render of this test. */
const SPEC: Omit<IAutoMovieRenderSpec, "frameFormat"> = {
  target: "production",
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 18,
};

/** Two seconds at 10 fps, delivered at 16 by 10, with no cut. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "cut",
  durationSeconds: 2,
  fps: 10,
  width: 16,
  height: 10,
  views: [],
  drawables: [],
  marks: [],
};

/** Render a subject over the page double, keeping the files in memory. */
async function render(subject: IAutoMovieCaptureSubject): Promise<{
  result: IAutoMovieDrawnVideoResult;
  encoded: IAutoMovieDrawnVideoResult["cut"];
}> {
  const double: createDrawPageDouble.IDouble = createDrawPageDouble({
    subject,
    renderer: "test",
    answer: answerDrawCall,
  });
  const session: AutoMovieDrawSession = await AutoMovieDrawSession.open({
    page: double.page,
    url: "http://127.0.0.1:1/render/index.html",
    props: { subject: subject.name, props: null },
    backend: "swiftshader",
    timeout: 1000,
  });
  let encoded: IAutoMovieDrawnVideoResult["cut"];
  const result: IAutoMovieDrawnVideoResult = await renderAutoMovieDrawnVideo({
    session,
    spec: SPEC,
    frameDir: "frames",
    outputPath: "film.mp4",
    audio: null,
    write: async (): Promise<void> => {},
    read: async (path: string): Promise<Uint8Array> => {
      throw new Error(`No sound file "${path}" in this fixture`);
    },
    encode: async (
      _args: readonly string[],
      drawn: Pick<IAutoMovieDrawnVideoResult, "cut">,
    ): Promise<void> => {
      encoded = drawn.cut;
    },
  });
  return { result, encoded };
}

/**
 * A subject's cut comes back with each sequence entry's live output frames,
 * computed on the instants the frames were drawn at by the rule the playback
 * cursor samples by.
 *
 * Scenarios:
 *
 * 1. Two seconds at 10 fps with entries starting at 0, 0.75 and 1.25 s, played
 *    0.75, 0.85 and 0.75 s, the third opening with a 0.35 s dissolve: no start
 *    falls on a frame instant, and the ranges are `[0, 8)`, `[8, 13)` and `[13,
 *    20)`, since frame 7 at 0.7 s is before 0.75 s, frame 8 at 0.8 s after it,
 *    frame 12 at 1.2 s before 1.25 s and frame 13 at 1.3 s after it.
 * 2. The second entry plays the first entry's shot, and both rows are kept, keyed
 *    by entry.
 * 3. An entry that omits `playbackRate` has none in its row, and one that states
 *    it keeps it.
 * 4. The encoder callback receives the same cut, so a failed encode still reports
 *    it.
 * 5. An entry whose start falls exactly on a frame instant is live from that
 *    frame, and an entry passed over by the next one's equal start gets an
 *    empty range.
 * 6. A subject with no cut gives a result with no `cut`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Renders through a draw session over the page double and reads the result's `cut` and the cut handed to the encoder; a range rounded off the frame grid, a dropped repeated shot, an invented rate or a cut invented for a subject without one fails.
 * @evidence contracts/development/testing.md#independent-expectations The ranges follow by hand from frame `i` at `i / 10` s and the cursor rule "highest entry whose start is at or before the instant", as worked in scenario 1; the 0.3 s start of scenario 5 is the instant of frame 3 because `frameTimes` computes `3 / 10`, the same expression the start is written as.
 * @evidence contracts/development/testing.md#distinguishing-cases Starts between frames, on a frame and equal to the next start, a repeated shot, a present and an absent rate, and no cut at all; the report's copy of the cut and its publish rule are owned by `test_cli_render_video_delivery`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_drawn_video_cut`; the page, files and encoder are in-memory doubles and nothing is launched.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_draw_drawn_video_cut(): Promise<void> {
  // 1 to 4. A cut with a repeated shot and a closing dissolve.
  const { result, encoded }: Awaited<ReturnType<typeof render>> = await render({
    ...SUBJECT,
    cut: {
      runtime: 2,
      entries: [
        { entry: 0, shot: "shot:a", start: 0, played: 0.75, offset: 0 },
        { entry: 1, shot: "shot:a", start: 0.75, played: 0.85, offset: 1 },
        {
          entry: 2,
          shot: "shot:b",
          start: 1.25,
          played: 0.75,
          offset: 0.5,
          playbackRate: 2,
        },
      ],
    },
  });
  const cut: IAutoMovieDeliveredCutEntry[] = result.cut!;
  TestValidator.equals(
    "each entry's live output frames",
    cut.map(
      (row: IAutoMovieDeliveredCutEntry): [number, number] => row.liveFrames,
    ),
    [
      [0, 8],
      [8, 13],
      [13, 20],
    ],
  );
  TestValidator.equals(
    "rows keyed by entry keep a repeated shot",
    cut.map((row: IAutoMovieDeliveredCutEntry): [number, string] => [
      row.entry,
      row.shot,
    ]),
    [
      [0, "shot:a"],
      [1, "shot:a"],
      [2, "shot:b"],
    ],
  );
  TestValidator.equals(
    "a rate only where the entry states one",
    cut.map(
      (row: IAutoMovieDeliveredCutEntry): boolean => "playbackRate" in row,
    ),
    [false, false, true],
  );
  TestValidator.equals("the entry's fields are copied", cut[1], {
    entry: 1,
    shot: "shot:a",
    start: 0.75,
    played: 0.85,
    offset: 1,
    liveFrames: [8, 13],
  });
  TestValidator.equals("the encoder is handed the same cut", encoded, cut);

  // 5. A start on a frame instant, and a start the next entry shares.
  const exact: IAutoMovieDeliveredCutEntry[] = (
    await render({
      ...SUBJECT,
      durationSeconds: 1,
      cut: {
        runtime: 1,
        entries: [
          { entry: 0, shot: "a", start: 0, played: 3 / 10, offset: 0 },
          { entry: 1, shot: "b", start: 3 / 10, played: 0.2, offset: 0 },
          { entry: 2, shot: "c", start: 3 / 10, played: 0.7, offset: 0 },
        ],
      },
    })
  ).result.cut!;
  TestValidator.equals(
    "a start on frame 3's instant, and an entry passed over",
    exact.map(
      (row: IAutoMovieDeliveredCutEntry): [number, number] => row.liveFrames,
    ),
    [
      [0, 3],
      [3, 3],
      [3, 10],
    ],
  );

  // 6. No cut.
  const plain: IAutoMovieDrawnVideoResult = (await render(SUBJECT)).result;
  TestValidator.equals("no cut is invented", "cut" in plain, false);
}
