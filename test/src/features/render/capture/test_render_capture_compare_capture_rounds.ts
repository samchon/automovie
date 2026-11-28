import type {
  IAutoMovieCaptureCellRecord,
  IAutoMovieCaptureRecord,
} from "@automovie/interface";
import { AutoMovieRenderPicture, AutoMovieRenderCapture, AutoMovieRenderInspectionCamera } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { PerspectiveCamera } from "three";

import { createCaptureFolderDouble } from "../../internal/createCaptureFolderDouble";

/**
 * `compareCaptureRounds` pairs this round's cells with an earlier
 * round's, measures the pairs and writes the difference images and sheets.
 *
 * Scenarios:
 *
 * 1. A cell both rounds drew with one backend, one pixel apart, is paired as a
 *    difference of 1 changed pixel and writes `diff-c1.png`.
 * 2. A cell the earlier round failed, a cell only this round has and a cell only
 *    the earlier round has are unmatched, each with its cause.
 * 3. The pictures are laid on `comparison-001.png`, claimed before it is written;
 *    without an earlier round a comparison is refused.
 * 4. A native frame and a continuous pose with the same rounded display time
 *    remain separate witnesses. Time matching accepts the same exact second
 *    from two native grids.
 * 5. The same camera summary cannot pair different applied projections.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains pairing, mismatch diagnostics, existing artifact order and frame/pose identity.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public comparison operation through a memory folder with real PNG inputs and inspects its retained entries and diff files.
 * @evidence contracts/development/testing.md#independent-expectations One changed pixel is constructed explicitly. Native frame 24 at 1 second differs from a continuous 1.0000004-second pose even though both display as 1.000000. Frame 30 at 1 second on a 30 fps grid shares presentation time with frame 24 at 1 second on a 24 fps grid.
 */
export async function test_render_capture_compare_capture_rounds(): Promise<void> {
  const raster = { width: 2, height: 2 };
  const pixels = (green: boolean): Uint8ClampedArray =>
    Uint8ClampedArray.from([
      ...(green ? [0, 255, 0, 255] : [255, 0, 0, 255]),
      255,
      0,
      0,
      255,
      255,
      0,
      0,
      255,
      255,
      0,
      0,
      255,
    ]);
  const png = (green: boolean): Promise<Uint8Array> =>
    AutoMovieRenderPicture.encodeRasterPng(
      { ...raster, pixels: pixels(green) },
      { alpha: true },
    );
  const base = (name: string, seconds: number) => ({
    index: 0,
    name,
    selection: { kind: "whole" as const, parts: [] },
    time: { seconds, frame: null },
    view: "front",
    pass: "beauty",
    label: null,
    sheet: "sheet.png",
    row: 0,
    column: 0,
  });
  const drawn = (
    name: string,
    seconds: number,
    file: string,
  ): IAutoMovieCaptureCellRecord => ({
    ...base(name, seconds),
    state: "drawn",
    file,
    hash: "h",
    backend: "gl",
    camera: null,
    repeat: null,
    resolved: null,
  });
  const failed = (
    name: string,
    seconds: number,
  ): IAutoMovieCaptureCellRecord => ({
    ...base(name, seconds),
    state: "failed",
    cause: "boom",
  });
  const budget = { longest: 4096, smallest: 16, reduction: "area" as const };
  const layout = AutoMovieRenderCapture.planLayout({
    ...raster,
    count: 3,
    group: 3,
    captions: [],
    budget,
  });
  const earlier: Extract<IAutoMovieCaptureRecord, { state: "complete" }> = {
    state: "complete",
    subject: { name: "hero", durationSeconds: 4, fps: 1, ...raster },
    revision: "r",
    request: [],
    budget,
    layout,
    times: [],
    windows: [],
    rows: [
      drawn("c1", 0, "old-c1.png"),
      failed("c2", 1),
      drawn("gone", 3, "old-gone.png"),
    ],
    sheets: [],
    comparison: null,
    video: null,
    section: null,
    files: [],
  };
  const folder = createCaptureFolderDouble({
    earlier,
    earlierFiles: new Map([
      ["old-c1.png", await png(false)],
      ["old-gone.png", await png(false)],
    ]),
    files: new Map([
      ["c1.png", await png(true)],
      ["c2.png", await png(false)],
      ["new.png", await png(false)],
    ]),
  });
  const result = await AutoMovieRenderCapture.compareRounds({
    folder,
    round: "before",
    rows: [
      drawn("c1", 0, "c1.png"),
      drawn("c2", 1, "c2.png"),
      drawn("new", 2, "new.png"),
    ],
    match: "cell",
    tolerance: 0,
    budget,
    raster,
  });
  TestValidator.equals(
    "entries",
    result.entries.map((entry): [string, string | null, string | null] => [
      entry.state,
      entry.current,
      entry.state === "unmatched" ? entry.cause : null,
    ]),
    [
      ["paired", "c1", null],
      ["unmatched", "c2", "round before did not draw it: boom"],
      ["unmatched", "new", "round before has no such cell"],
      ["unmatched", null, "this capture has no such cell"],
    ],
  );
  const first = result.entries[0]!;
  TestValidator.equals(
    "difference",
    first.state === "paired" && first.mode === "difference"
      ? [first.changed, first.difference]
      : null,
    [1, "diff-c1.png"],
  );
  TestValidator.predicate(
    "files",
    folder.files.has("diff-c1.png") &&
      folder.files.has("comparison-001.png") &&
      result.sheets[0] === "comparison-001.png" &&
      folder.claimed.includes("comparison-001.png"),
  );
  await TestValidator.error("no earlier round", async (): Promise<void> => {
    await AutoMovieRenderCapture.compareRounds({
      folder: createCaptureFolderDouble({
        earlier: null,
        earlierFiles: new Map(),
        files: new Map(),
      }),
      round: "before",
      rows: [],
      match: "cell",
      tolerance: 0,
      budget,
      raster,
    });
  });
  const exactFrame: IAutoMovieCaptureCellRecord = {
    ...drawn("native", 1, "old-native.png"),
    time: { seconds: 1, frame: 24 },
  };
  const compareClock = async (
    time: IAutoMovieCaptureCellRecord["time"],
    match: "cell" | "time",
  ): Promise<string[]> => {
    const sample: IAutoMovieCaptureCellRecord = { ...drawn("sample", time.seconds, "sample.png"), time };
    const { entries } = await AutoMovieRenderCapture.compareRounds({
      folder: createCaptureFolderDouble({
        earlier: { ...earlier, rows: [exactFrame] },
        earlierFiles: new Map([["old-native.png", await png(false)]]),
        files: new Map([["sample.png", await png(false)]]),
      }),
      round: "before", rows: [sample], match, tolerance: 0, budget, raster,
    });
    return entries.map(({ state }) => state);
  };
  TestValidator.equals("display rounding cannot pair a native image and a pose", [
    await compareClock({ seconds: 1.0000004, frame: null }, "time"),
    await compareClock({ seconds: 1, frame: null }, "cell"),
  ], [["unmatched", "unmatched"], ["unmatched", "unmatched"]]);
  TestValidator.equals("distinct native grids can share exact presentation time", [
    await compareClock({ seconds: 1, frame: 30 }, "time"),
    await compareClock({ seconds: 1, frame: 30 }, "cell"),
  ], [["paired"], ["unmatched", "unmatched"]]);

  const camera: PerspectiveCamera = new PerspectiveCamera(45, 1, 0.1, 30);
  const resolve = () => AutoMovieRenderInspectionCamera.resolveView({
    view: { type: "film" }, text: "film", bounds: null, camera, seconds: 0, ...raster,
  }).record;
  const full = resolve();
  camera.setViewOffset(2, 2, 0, 0, 1, 2);
  const cropped = resolve();
  const { projectionIdentity: _uncopied, ...legacy } = full;
  const byProjection = async (previous: string, current: string): Promise<string[]> => {
    const row = drawn("current", 0, "current.png");
    const old = drawn("earlier", 0, "earlier.png");
    if (row.state !== "drawn" || old.state !== "drawn") throw Error("Expected a drawn pair");
    const { entries } = await AutoMovieRenderCapture.compareRounds({
      folder: createCaptureFolderDouble({
        earlier: { ...earlier, rows: [{ ...old, camera: previous }] },
        earlierFiles: new Map([[old.file, await png(false)]]),
        files: new Map([[row.file, await png(false)]]),
      }),
      round: "before", rows: [{ ...row, camera: current }], match: "cell", tolerance: 0, budget, raster,
    });
    return entries.map(({ state }) => state);
  };
  const exact: string = JSON.stringify(full);
  TestValidator.equals("equal native projection", await byProjection(exact, exact), ["paired"]);
  TestValidator.equals("different crop with same summary", await byProjection(exact, JSON.stringify(cropped)), ["unmatched"]);
  TestValidator.equals("legacy summary cannot establish exact pairing", await byProjection(JSON.stringify(legacy), exact), ["unmatched"]);
}
