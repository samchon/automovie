import type {
  IAutoMovieCaptureCell,
  IAutoMovieCaptureCellComparison,
  IAutoMovieCaptureCellRecord,
  IAutoMovieCaptureDrawing,
  IAutoMovieCapturePlan,
  IAutoMovieCaptureRecord,
  IAutoMovieCaptureSubject,
  IAutoMovieRasterImage,
} from "@automovie/interface";
import { AutoMovieRenderCaptureFolder, AutoMovieRenderPicture, AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { rejectsError } from "../internal/rejectsError";
import { createCaptureMemory } from "./createCaptureMemory";

/** A source of two seconds at 10 fps, drawn 16 by 9. */
const SOURCE: IAutoMovieCaptureSubject = {
  name: "clip",
  durationSeconds: 2,
  fps: 10,
  width: 16,
  height: 9,
  views: [],
  drawables: [],
  marks: [],
};

/** A flat 16 by 9 picture of one shade. */
function flat(shade: number): IAutoMovieRasterImage {
  const pixels: Uint8ClampedArray = new Uint8ClampedArray(16 * 9 * 4);
  for (let offset: number = 0; offset < pixels.length; offset += 4)
    pixels.set([shade, shade, shade, 255], offset);
  return { width: 16, height: 9, pixels };
}

/**
 * A video file is captured from its own frames through the injected process
 * runner, around its detected cuts, and paired second by second with the stills
 * its source drew, a missing second staying as an unmatched cell with its
 * cause.
 *
 * Scenarios:
 *
 * 1. A recording runner sees exactly two FFmpeg runs, the scene-cut detection and
 *    then one frame extraction, and nothing else is launched.
 * 2. A file whose report holds one cut at 1.0 s plans the frames within the window
 *    around it beside the even samples, records the cut with its score and
 *    threshold, and captions each still by frame and second.
 * 3. A file of the source's length, captured as a round compared against the
 *    source's round, pairs one cell per planned second side by side, because
 *    the file's stills come from FFmpeg and the source's from another backend.
 * 4. A file shorter than its stated duration leaves the missing frames as failed
 *    cells naming the frame, and the pairing reports those seconds unmatched
 *    with that cause.
 * 5. Two captures of the same file share a backend, so they pair as differences
 *    with no changed pixel.
 * 6. A file with no cut records zero cuts at the threshold used and plans no cut
 *    window.
 * 7. A request with views, passes or an inspection is refused before anything
 *    runs.
 * 8. A source with beauty and depth at the same second pairs file beauty side by
 *    side with source beauty in either pass order; its depth cell stays
 *    unmatched. A source with only depth gives no pair at that second.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public video capture against in-memory storage and a runner that writes what FFmpeg would (the report and the numbered stills) for the arguments it receives, then reads the records and comparisons. It catches captures that lose cut frames or unmatched cells, compare pixels across backends or pair file beauty with a different pass. No FFmpeg is launched.
 * @evidence contracts/development/testing.md#independent-expectations The runner selects frames by evaluating the planned `select` expression itself, so the stills it writes follow the arguments, and every expected frame and second is worked from 10 fps by hand; the side-by-side rule is the campaign's decision that pixels are compared within one backend only.
 * @evidence contracts/development/testing.md#distinguishing-cases A full-length file against a short one, file against source and file against file, cuts against none, a refused request, and a source with beauty before depth, after depth, or absent. Argument and report formats are owned by `test_capture_video_ffmpeg_plans`, and frame windows by `test_capture_frame_windows`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_video_pairing`; its runner is in memory and starts no process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases, each naming the input and the behavior it pins.
 */
export async function test_capture_video_pairing(): Promise<void> {
  const memory: createCaptureMemory.IMemory = createCaptureMemory();
  const calls: string[][] = [];

  // A runner that does what FFmpeg would: print the cuts, or write the selected frames the file holds.
  const runner: (
    report: string,
    held: number,
  ) => (args: readonly string[]) => Promise<void> =
    (
      report: string,
      held: number,
    ): ((args: readonly string[]) => Promise<void>) =>
    async (args: readonly string[]): Promise<void> => {
      calls.push([...args]);
      const filter: string = args[args.indexOf("-vf") + 1]!;
      if (filter.startsWith("scdet")) {
        await memory.storage.writeFile(filter.split("file=")[1]!, report);
        return;
      }
      const terms: string[] = /select='(.*)'/u.exec(filter)![1]!.split("+");
      const selected: number[] = [];
      for (let n: number = 0; n < held; n++)
        if (
          terms.some((term: string): boolean => {
            const values: number[] = term
              .replace(/[a-z()]/gu, "")
              .split(",")
              .slice(1)
              .map(Number);
            return term.startsWith("eq")
              ? n === values[0]
              : n >= values[0]! && n <= values[1]!;
          })
        )
          selected.push(n);
      const pattern: string = args.at(-1)!;
      for (const [k, n] of selected.entries())
        await memory.storage.writeFile(
          pattern.replace("%05d", String(k).padStart(5, "0")),
          await AutoMovieRenderPicture.encodeRasterPng(flat(n * 10)),
        );
    };
  const request: (
    text: string,
  ) => ReturnType<typeof AutoMovieRenderCapture.parsePlanRequest> = (
    text: string,
  ): ReturnType<typeof AutoMovieRenderCapture.parsePlanRequest> =>
    AutoMovieRenderCapture.parsePlanRequest(new URLSearchParams(text));
  const video: (
    text: string,
    report: string,
    held: number,
  ) => Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> = (
    text: string,
    report: string,
    held: number,
  ): Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> =>
    AutoMovieRenderCapture.runVideo({
      file: "clip.mp4",
      subject: SOURCE,
      request: request(text),
      storage: memory.storage,
      root: "out",
      run: runner(report, held),
      revision: "r",
    });

  /** Write a round that draws the source in a different backend. */
  const source: (text: string) => Promise<void> = async (
    text: string,
  ): Promise<void> => {
    const plan: IAutoMovieCapturePlan = AutoMovieRenderCapture.plan({
      request: request(text),
      subject: SOURCE,
      cuts: [],
    });
    await AutoMovieRenderCapture.run({
      plan,
      folder: await AutoMovieRenderCaptureFolder.open({
        storage: memory.storage,
        root: "out",
        round: plan.request.round,
        compare: null,
      }),
      revision: "r",
      match: "cell",
      draw: async (
        cell: IAutoMovieCaptureCell,
      ): Promise<IAutoMovieCaptureDrawing> => ({
        picture: flat(cell.time.frame! * 10),
        labels: [],
        backend: "swiftshader",
      }),
    });
  };
  await source("rate=2&round=source");

  // 1 and 2. Two runs, frames around the cut, the cut recorded.
  const cutReport: string =
    "frame:10 pts:10 pts_time:1\nlavfi.scd.score=37.5\nlavfi.scd.time=1\n";
  const full: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await video("rate=2&window=1&round=file&compare=source", cutReport, 20);
  TestValidator.equals(
    "two FFmpeg runs, detection then extraction",
    calls.map(
      (args: string[]): string => args[args.indexOf("-vf") + 1]!.split("=")[0]!,
    ),
    ["scdet", "select"],
  );
  TestValidator.equals(
    "frames around the cut join the samples",
    full.rows.map(
      (row: IAutoMovieCaptureCellRecord): number | null => row.time.frame,
    ),
    [0, 5, 9, 10, 11, 15],
  );
  TestValidator.equals("the cut is recorded", full.video, {
    file: "clip.mp4",
    threshold: 10,
    cuts: [{ seconds: 1, score: 37.5 }],
  });

  // 3. One side-by-side pair per planned second the source holds; the cut frames the source lacks are unmatched.
  TestValidator.equals(
    "pairs with the source by second",
    full.comparison!.entries.map(
      (entry: IAutoMovieCaptureCellComparison): string =>
        entry.state === "paired"
          ? `${entry.current} ${entry.mode}`
          : `${entry.current} unmatched`,
    ),
    [
      "t000.000-file-beauty side-by-side",
      "t000.500-file-beauty side-by-side",
      "t000.900-file-beauty unmatched",
      "t001.000-file-beauty side-by-side",
      "t001.100-file-beauty unmatched",
      "t001.500-file-beauty side-by-side",
    ],
  );

  // 4. A shorter file.
  const short: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await video("rate=2&round=short&compare=source", "", 12);
  TestValidator.equals(
    "missing frames are failed cells and unmatched seconds",
    short.comparison!.entries.map(
      (entry: IAutoMovieCaptureCellComparison): string =>
        entry.state === "paired" ? entry.mode : entry.cause,
    ),
    [
      "side-by-side",
      "side-by-side",
      "side-by-side",
      "this capture did not draw it: clip.mp4 has no frame 15: ENOENT: no such file out/rounds/short/s00003.png",
    ],
  );

  // 5. File against file.
  const again: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await video("rate=2&window=1&round=again&compare=file", cutReport, 20);
  TestValidator.predicate(
    "one backend pairs as unchanged differences",
    again.comparison!.entries.every(
      (entry: IAutoMovieCaptureCellComparison): boolean =>
        entry.state === "paired" &&
        entry.mode === "difference" &&
        entry.changed === 0,
    ),
  );

  // 6. No cut.
  TestValidator.equals(
    "zero cuts at the threshold used",
    [short.video, short.windows],
    [{ file: "clip.mp4", threshold: 10, cuts: [] }, []],
  );

  // 7. A request a file cannot honour.
  const before: number = calls.length;
  for (const text of [
    "views=front",
    "passes=clay,depth",
    "marks=curve/**",
    "at=0.05",
  ])
    TestValidator.predicate(
      `${text} is refused`,
      await rejectsError((): Promise<unknown> => video(text, "", 20)),
    );
  TestValidator.equals(
    "nothing ran for a refused request",
    calls.length,
    before,
  );

  // 8. File beauty can compare to source beauty, with or without another pass beside it.
  for (const [round, passes] of [
    ["beauty-first", "beauty,depth"],
    ["depth-first", "depth,beauty"],
  ]) {
    await source(`at=1&round=${round}&passes=${passes}`);
    const compared: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
      await video(`at=1&round=file-${round}&compare=${round}`, "", 20);
    TestValidator.equals(
      `${passes} keeps the compatible still and reports the other pass`,
      compared.comparison!.entries.map(pair),
      [
        ["side-by-side", "t001.000-file-beauty", "t001.000-film-beauty"],
        ["unmatched", null, "t001.000-film-depth"],
      ],
    );
  }
  await source("at=1&round=depth-only&passes=depth");
  const incompatible: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await video("at=1&round=file-depth-only&compare=depth-only", "", 20);
  TestValidator.equals(
    "beauty and depth alone produce separate unmatched cells",
    incompatible.comparison!.entries.map(pair),
    [
      ["unmatched", "t001.000-file-beauty", null],
      ["unmatched", null, "t001.000-film-depth"],
    ],
  );
}

/** The comparison mode and both cell names, leaving causes to the round test. */
function pair(
  entry: IAutoMovieCaptureCellComparison,
): [string, string | null, string | null] {
  return [
    entry.state === "paired" ? entry.mode : entry.state,
    entry.current,
    entry.earlier,
  ];
}
