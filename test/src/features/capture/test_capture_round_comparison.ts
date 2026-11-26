import type {
  IAutoMovieCaptureCell,
  IAutoMovieCaptureCellComparison,
  IAutoMovieCaptureCellRecord,
  IAutoMovieCaptureDrawing,
  IAutoMovieCapturePlan,
  IAutoMovieCaptureRecord,
  IAutoMovieCaptureSubject,
  IAutoMovieInspectionCamera,
  IAutoMovieRasterImage,
} from "@automovie/interface";
import {
  AutoMovieCaptureFolder,
  AutoMovieRenderPicture,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  runAutoMovieCapture,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createCaptureMemory } from "./createCaptureMemory";

/** A subject of four seconds at 10 fps, drawn 32 by 18. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "s",
  durationSeconds: 4,
  fps: 10,
  width: 32,
  height: 18,
  views: ["front", "right"],
  drawables: [],
  marks: [],
};

/**
 * A round comparison pairs cells by what fixes them and reports every cell one
 * round lacks as unmatched with its cause, measuring pixels only between stills
 * of one backend.
 *
 * Scenarios:
 *
 * 1. A second round missing the first round's cell at 2 s reports that cell
 *    unmatched with the cause that this capture has no such cell; the cell at 1
 *    s, drawn alike, pairs with no changed pixel, no difference image and equal
 *    hashes in both records.
 * 2. A third round changing one pixel at 2 s pairs it with one changed pixel, the
 *    box of that pixel and a difference image; a cell at 3 s the compared round
 *    lacks is unmatched with the cause that the round has no such cell.
 * 3. A cell drawn by another backend is laid side by side with no difference
 *    numbers.
 * 4. A cell whose resolved camera differs is unmatched naming both cameras, and a
 *    cell the compared round failed to draw is unmatched with that failure.
 * 5. Each comparison writes a comparison sheet of three cells per entry, two
 *    entries of 32 by 18 stills sharing one 192 by 45 row with a four-line 27
 *    px caption strip, since a caption such as `before t001.000-film-beauty`
 *    wraps at 7 characters, and the record lists the comparison.
 * 6. A time comparison with several views and passes on each side keeps all rows
 *    and pairs their matching views, regardless of plan order.
 * 7. A time comparison cannot choose between two source views of one pass when the
 *    current view identifies neither. All three cells are unmatched and explain
 *    the ambiguity.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs real rounds through the public planner, folder and run against in-memory storage and reads the comparison in each record and the files written; a comparison over only the matching cells, one that measured across backends, or one that paired cells seen through different cameras fails.
 * @evidence contracts/development/testing.md#independent-expectations Every still is a flat colour this test chooses, so which pixels change, where, and whether hashes agree is known by hand; the pairing and unmatched rules are those of `.agents/skills/visual-debugging/comparison.md`.
 * @evidence contracts/development/testing.md#distinguishing-cases An unchanged pair, a one-pixel change, a cell only in the earlier round, a cell only in the later round, a backend change, a camera change, an earlier failure, and several same-time cells with either uniquely corresponding or ambiguous views. Folder refusals of a missing round are owned by `test_capture_folder_ownership`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_round_comparison`; it draws in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases, each naming the input and the behavior it pins.
 */
export async function test_capture_round_comparison(): Promise<void> {
  const memory: createCaptureMemory.IMemory = createCaptureMemory();
  const capture: (
    text: string,
    draw: (cell: IAutoMovieCaptureCell) => IAutoMovieCaptureDrawing,
    match?: "cell" | "time",
  ) => Promise<
    Extract<IAutoMovieCaptureRecord, { state: "complete" }>
  > = async (
    text: string,
    draw: (cell: IAutoMovieCaptureCell) => IAutoMovieCaptureDrawing,
    match: "cell" | "time" = "cell",
  ): Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> => {
    const plan: IAutoMovieCapturePlan = planAutoMovieCapture({
      request: parseAutoMovieCapturePlanRequest(new URLSearchParams(text)),
      subject: SUBJECT,
      cuts: [],
    });
    return runAutoMovieCapture({
      plan,
      draw: async (
        cell: IAutoMovieCaptureCell,
      ): Promise<IAutoMovieCaptureDrawing> => draw(cell),
      folder: await AutoMovieCaptureFolder.open({
        storage: memory.storage,
        root: "out",
        round: plan.request.round,
        compare: plan.request.compare,
      }),
      revision: "r",
      match,
    });
  };
  const flat: (
    changed: boolean,
    backend?: string,
    camera?: string | null,
  ) => IAutoMovieCaptureDrawing = (
    changed: boolean,
    backend: string = "cpu",
    camera: string | null = "0,0,4:0,0,0",
  ): IAutoMovieCaptureDrawing => {
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(32 * 18 * 4);
    for (let offset: number = 0; offset < pixels.length; offset += 4)
      pixels.set([0, 90, 180, 255], offset);
    if (changed) pixels.set([255, 255, 255, 255], (10 * 32 + 20) * 4);
    return {
      picture: { width: 32, height: 18, pixels },
      labels: [],
      backend,
      ...(camera === null ? {} : { camera }),
    };
  };
  const hash: (
    record: Extract<IAutoMovieCaptureRecord, { state: "complete" }>,
    index: number,
  ) => string = (
    record: Extract<IAutoMovieCaptureRecord, { state: "complete" }>,
    index: number,
  ): string => {
    const row: IAutoMovieCaptureCellRecord = record.rows[index]!;
    return row.state === "drawn" ? row.hash : "";
  };

  // 1. A cell missing in the second round.
  const before: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await capture(
      "at=1,2&round=before",
      (): IAutoMovieCaptureDrawing => flat(false),
    );
  const after: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await capture(
      "at=1&round=after&compare=before",
      (): IAutoMovieCaptureDrawing => flat(false),
    );
  TestValidator.equals(
    "the missing cell is unmatched and the kept one unchanged",
    after.comparison!.entries,
    [
      {
        state: "paired",
        mode: "difference",
        current: "t001.000-film-beauty",
        earlier: "t001.000-film-beauty",
        changed: 0,
        ratio: 0,
        maximum: 0,
        bounds: null,
        difference: null,
      },
      {
        state: "unmatched",
        current: null,
        earlier: "t002.000-film-beauty",
        cause: "this capture has no such cell",
      },
    ],
  );
  TestValidator.equals(
    "an unchanged still keeps its hash",
    hash(after, 0),
    hash(before, 0),
  );

  // 2. A changed pixel and a cell the earlier round lacks.
  const third: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await capture(
      "at=1,2,3&round=third&compare=before",
      (cell: IAutoMovieCaptureCell): IAutoMovieCaptureDrawing =>
        flat(cell.index === 1),
    );
  const changed: IAutoMovieCaptureCellComparison =
    third.comparison!.entries[1]!;
  TestValidator.equals(
    "one changed pixel is measured with its box and image",
    changed.state === "paired" && changed.mode === "difference"
      ? [changed.changed, changed.bounds, changed.difference]
      : null,
    [
      1,
      { left: 20, top: 10, right: 20, bottom: 10 },
      "diff-t002.000-film-beauty.png",
    ],
  );
  TestValidator.predicate(
    "the changed still's hash differs",
    hash(third, 1) !== hash(before, 1),
  );
  const image: IAutoMovieRasterImage =
    await AutoMovieRenderPicture.decodeRasterPng(
      memory.files.get("out/rounds/third/diff-t002.000-film-beauty.png")!,
    );
  TestValidator.equals(
    "the difference image marks the pixel in magenta",
    Array.from(
      image.pixels.subarray((10 * 32 + 20) * 4, (10 * 32 + 20) * 4 + 3),
    ),
    [255, 0, 255],
  );
  TestValidator.equals(
    "a cell the earlier round lacks is unmatched",
    third.comparison!.entries[2],
    {
      state: "unmatched",
      current: "t003.000-film-beauty",
      earlier: null,
      cause: "round before has no such cell",
    },
  );

  // 3. Another backend.
  const other: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await capture(
      "at=1&round=other&compare=before",
      (): IAutoMovieCaptureDrawing => flat(false, "gpu"),
    );
  TestValidator.equals(
    "another backend is laid side by side",
    other.comparison!.entries[0],
    {
      state: "paired",
      mode: "side-by-side",
      current: "t001.000-film-beauty",
      earlier: "t001.000-film-beauty",
    },
  );

  // 4. Another camera, and an earlier failure.
  await capture(
    "at=1,2&round=failing",
    (cell: IAutoMovieCaptureCell): IAutoMovieCaptureDrawing => {
      if (cell.index === 1) throw new Error("no light");
      return flat(false);
    },
  );
  const moved: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await capture(
      "at=1,2&round=moved&compare=failing",
      (): IAutoMovieCaptureDrawing => flat(false, "cpu", "0,0,5:0,0,0"),
    );
  TestValidator.equals(
    "a moved camera and an earlier failure are unmatched",
    moved.comparison!.entries.map(
      (entry: IAutoMovieCaptureCellComparison): string =>
        entry.state === "unmatched" ? entry.cause : entry.state,
    ),
    [
      "the resolved cameras differ: 0,0,4:0,0,0 in round failing against 0,0,5:0,0,0",
      "round failing did not draw it: no light",
    ],
  );

  // 5. Comparison sheets.
  TestValidator.equals(
    "a comparison sheet is written and recorded",
    [
      after.comparison!.sheets,
      memory.files.has("out/rounds/after/comparison-001.png"),
      after.files.includes("comparison-001.png"),
    ],
    [["comparison-001.png"], true, true],
  );
  const sheet: IAutoMovieRasterImage =
    await AutoMovieRenderPicture.decodeRasterPng(
      memory.files.get("out/rounds/after/comparison-001.png")!,
    );
  TestValidator.equals(
    "two entries of three cells share one row with its caption strip",
    [sheet.width, sheet.height],
    [192, 45],
  );

  // 6. Multiple current and earlier views and passes, in reverse order.
  await capture(
    "at=1&views=front;right&passes=beauty,depth&round=many",
    (): IAutoMovieCaptureDrawing => flat(false),
  );
  const reordered: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await capture(
      "at=1&views=right;front&passes=depth,beauty&round=reordered&compare=many",
      (): IAutoMovieCaptureDrawing => flat(false),
      "time",
    );
  TestValidator.equals(
    "all equal-time cells pair by their corresponding pass and view",
    reordered.comparison!.entries.map(
      (entry: IAutoMovieCaptureCellComparison): [string, string] | null =>
        entry.state === "paired" ? [entry.current, entry.earlier] : null,
    ),
    [
      ["t001.000-right-depth", "t001.000-right-depth"],
      ["t001.000-right-beauty", "t001.000-right-beauty"],
      ["t001.000-front-depth", "t001.000-front-depth"],
      ["t001.000-front-beauty", "t001.000-front-beauty"],
    ],
  );

  // 7. An unmatched view cannot identify one of two same-time beauty cells.
  await capture(
    "at=1&views=front;right&round=two-views",
    (): IAutoMovieCaptureDrawing => flat(false),
  );
  const ambiguous: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await capture(
      "at=1&round=ambiguous&compare=two-views",
      (): IAutoMovieCaptureDrawing => flat(false),
      "time",
    );
  TestValidator.equals(
    "the ambiguous current cell and both source cells are reported separately",
    ambiguous.comparison!.entries.map(
      (
        entry: IAutoMovieCaptureCellComparison,
      ): [string | null, string | null] | null =>
        entry.state === "unmatched" && entry.cause.includes("ambiguous")
          ? [entry.current, entry.earlier]
          : null,
    ),
    [
      ["t001.000-film-beauty", null],
      [null, "t001.000-front-beauty"],
      [null, "t001.000-right-beauty"],
    ],
  );

  const camera: IAutoMovieInspectionCamera = {
    view: "film",
    projection: "perspective",
    position: { x: 0, y: 0, z: 4 },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    fovDeg: 50,
    metresPerPixel: null,
    near: 0.1,
    far: 2000,
  };
  const film: string = JSON.stringify(camera);
  const front: string = JSON.stringify({ ...camera, view: "front" });
  const wide: string = JSON.stringify({ ...camera, view: "front", fovDeg: 60 });
  const opaqueFilm: string = '{"view":"film"}';
  const opaqueFront: string = '{"view":"front"}';
  const earlierCameras: string[] = [
    "0,0,4:0,0,0",
    film,
    film,
    film,
    film,
    opaqueFilm,
  ];
  const currentCameras: (string | null)[] = [
    "0,0,5:0,0,0",
    front,
    null,
    null,
    wide,
    opaqueFront,
  ];
  await capture(
    "at=0.5,1,1.5,2,2.5,3&round=known-camera",
    (cell: IAutoMovieCaptureCell): IAutoMovieCaptureDrawing =>
      flat(false, "cpu", earlierCameras[cell.index]!),
  );
  const timeCameras: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await capture(
      "at=0.5,1,1.5,2,2.5,3&views=front&round=time-cameras&compare=known-camera",
      (cell: IAutoMovieCaptureCell): IAutoMovieCaptureDrawing =>
        flat(
          true,
          cell.index === 3 ? "gpu" : "cpu",
          currentCameras[cell.index]!,
        ),
      "time",
    );
  TestValidator.equals(
    "known different cameras do not produce pixel differences for time matches",
    timeCameras.comparison!.entries.map(
      (entry: IAutoMovieCaptureCellComparison): string | [string, number] =>
        entry.state === "unmatched"
          ? entry.cause
          : entry.mode === "difference"
            ? [entry.mode, entry.changed]
            : entry.mode,
    ),
    [
      "the resolved cameras differ: 0,0,4:0,0,0 in round known-camera against 0,0,5:0,0,0",
      ["difference", 1],
      ["difference", 1],
      "side-by-side",
      `the resolved cameras differ: ${film} in round known-camera against ${wide}`,
      `the resolved cameras differ: ${opaqueFilm} in round known-camera against ${opaqueFront}`,
    ],
  );
  TestValidator.equals(
    "the incompatible pair retains both stills on the sheet and leaves no difference image",
    [
      timeCameras.comparison!.entries[0]!.earlier,
      timeCameras.comparison!.entries[0]!.current,
      timeCameras.comparison!.sheets.length > 0,
      timeCameras.files.includes("diff-t000.500-front-beauty.png"),
    ],
    ["t000.500-film-beauty", "t000.500-front-beauty", true, false],
  );
}
