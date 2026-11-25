import type {
  IAutoMovieCaptureCellRecord,
  IAutoMovieCaptureRecord,
} from "@automovie/interface";
import {
  compareAutoMovieCaptureRounds,
  encodeAutoMovieRasterPng,
  planAutoMovieCaptureLayout,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createCaptureFolderDouble } from "../../../internal/createCaptureFolderDouble";

/**
 * `compareAutoMovieCaptureRounds` pairs this round's cells with an earlier
 * round's, measures the pairs and writes the difference images and sheets.
 *
 * Scenarios:
 *
 * 1. A cell both rounds drew with one backend, one pixel apart, is paired as a
 *    difference of 1 changed pixel and writes `diff-c1.png`.
 * 2. A cell the earlier round failed, a cell only this round has and a cell
 *    only the earlier round has are unmatched, each with its cause.
 * 3. The pictures are laid on `comparison-001.png`, claimed before it is
 *    written; without an earlier round a comparison is refused.
 */
export async function test_unit_render_capture_compare_capture_rounds(): Promise<void> {
  const raster = { width: 2, height: 2 };
  const pixels = (green: boolean): Uint8ClampedArray =>
    Uint8ClampedArray.from([
      ...(green ? [0, 255, 0, 255] : [255, 0, 0, 255]),
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
    ]);
  const png = (green: boolean): Promise<Uint8Array> =>
    encodeAutoMovieRasterPng({ ...raster, pixels: pixels(green) }, { alpha: true });
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
  const drawn = (name: string, seconds: number, file: string): IAutoMovieCaptureCellRecord => ({
    ...base(name, seconds),
    state: "drawn",
    file,
    hash: "h",
    backend: "gl",
    camera: null,
    repeat: null,
    resolved: null,
  });
  const failed = (name: string, seconds: number): IAutoMovieCaptureCellRecord => ({
    ...base(name, seconds),
    state: "failed",
    cause: "boom",
  });
  const budget = { longest: 4096, smallest: 16, reduction: "area" as const };
  const layout = planAutoMovieCaptureLayout({
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
  const result = await compareAutoMovieCaptureRounds({
    folder,
    round: "before",
    rows: [drawn("c1", 0, "c1.png"), drawn("c2", 1, "c2.png"), drawn("new", 2, "new.png")],
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
    await compareAutoMovieCaptureRounds({
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
}