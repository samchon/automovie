import {
  AutoMovieCaptureFolder,
  type IAutoMovieCaptureCell,
  type IAutoMovieCaptureDrawing,
  type IAutoMovieCapturePlan,
  type IAutoMovieCaptureRecord,
  type IAutoMovieCaptureStorage,
  type IAutoMovieCaptureSubject,
  type IAutoMovieRasterImage,
  decodeAutoMovieRasterPng,
  hashAutoMovieRasterImage,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  runAutoMovieCapture,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as fs from "node:fs/promises";

import { createCaptureMemory } from "./createCaptureMemory";

/** A Node host passes `node:fs/promises` as the storage with no adapter; this line fails compilation if it cannot. */
const NODE: IAutoMovieCaptureStorage = fs;

/** A subject of three seconds at 10 fps, drawn 64 by 36. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "duel",
  durationSeconds: 3,
  fps: 10,
  width: 64,
  height: 36,
  views: [],
  drawables: [],
  marks: [],
};

/**
 * A whole capture against an in-memory storage and a recording draw function writes every planned file, in the order the folder states, and nothing outside its root.
 *
 * Scenarios:
 *
 * 1. Two seconds through one view draw two cells in plan order; the storage sees: create and list the folder, the `running` record, both stills, the sheet, the `complete` record, and no other call.
 * 2. Every path touched lies under the root.
 * 3. The record lists the subject, the revision, the request as text, one drawn row per cell with its file, sheet position, backend, camera, the view text that repeats it and the pattern resolutions the draw stated, the sheet, and every file written including itself.
 * 4. Each row's hash is the hash of the still decoded from its file; the label the draw anchored at (40, 20) is stamped there, and the one anchored at (62, 34), whose 7 by 9 box would leave the 64 by 36 still, is moved inside it to (57, 27).
 * 5. A second capture into the same root replaces the first's stills, leaving only its own files and the record.
 * 6. A folder opened for another round than the plan's is refused before anything is written.
 * 7. `node:fs/promises` is assignable to the storage type, checked at compile time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public planner, folder and run against a Map-backed storage and reads the calls, the files and the record; a run that wrote a still before claiming it, wrote the record before the stills, touched a path outside its root, or recorded a hash of other bytes fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected call order is the order `AutoMovieCaptureFolder` documents, the names follow the plan's documented form, and the hash is recomputed from the file's own decoded pixels; the drawn colours are written by this test.
 * @evidence contracts/development/testing.md#distinguishing-cases A fresh folder against one holding a previous capture, a matching folder against one opened for another round. Foreign files are owned by `test_capture_folder_ownership`, failed cells by `test_capture_run_failed_cell`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_run_order`; `node:fs/promises` is only assigned, never called, and no file, browser or process is touched.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_capture_run_order(): Promise<void> {
  const memory: createCaptureMemory.IMemory = createCaptureMemory();
  const plan: (text: string) => IAutoMovieCapturePlan = (text: string): IAutoMovieCapturePlan =>
    planAutoMovieCapture({
      request: parseAutoMovieCapturePlanRequest(new URLSearchParams(text)),
      subject: SUBJECT,
      cuts: [],
    });
  const drawn: string[] = [];
  const draw: (cell: IAutoMovieCaptureCell) => Promise<IAutoMovieCaptureDrawing> = async (cell: IAutoMovieCaptureCell): Promise<IAutoMovieCaptureDrawing> => {
    drawn.push(cell.name);
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(64 * 36 * 4);
    for (let offset: number = 0; offset < pixels.length; offset += 4)
      pixels.set([40 * (cell.index + 1), 200, 120, 255], offset);
    return {
      picture: { width: 64, height: 36, pixels },
      labels: [
        { text: "a", x: 40, y: 20 },
        { text: "b", x: 62, y: 34 },
      ],
      backend: "memory",
      resolved: [{ role: "parts", pattern: "hero", paths: ["hero"], count: 2 }],
      camera: "0,1,4:0,1,0",
      repeat: "0,1,4:0,1,0@ortho=0.01",
    };
  };
  const capture: (text: string) => Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> = async (text: string): Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> => {
    const planned: IAutoMovieCapturePlan = plan(text);
    return runAutoMovieCapture({
      plan: planned,
      draw,
      folder: await AutoMovieCaptureFolder.open({
        storage: memory.storage,
        root: "out/duel",
        round: planned.request.round,
        compare: planned.request.compare,
      }),
      revision: "abc123",
      match: "cell",
    });
  };

  // 1. The order of calls.
  const record: Extract<IAutoMovieCaptureRecord, { state: "complete" }> = await capture("at=1,2&subject=duel");
  TestValidator.equals("cells are drawn in plan order", drawn, ["t001.000-film-beauty", "t002.000-film-beauty"]);
  TestValidator.equals("files are touched in the stated order", memory.log, [
    "mkdir out/duel",
    "readdir out/duel",
    "writeFile out/duel/record.json",
    "writeFile out/duel/t001.000-film-beauty.png",
    "writeFile out/duel/t002.000-film-beauty.png",
    "writeFile out/duel/sheet-001.png",
    "writeFile out/duel/record.json",
  ]);

  // 2. Nothing outside the root.
  TestValidator.predicate(
    "every path lies under the root",
    memory.log.every((call: string): boolean => /^\w+ out\/duel(\/|$)/u.test(call)),
  );

  // 3. The record.
  TestValidator.equals(
    "the record repeats the capture",
    [
      record.state,
      record.subject,
      record.revision,
      record.request,
      record.sheets,
      record.files,
      record.rows.map((row: IAutoMovieCaptureRecord.Row): unknown[] => [
        row.name,
        row.state,
        row.sheet,
        row.row,
        row.column,
        row.state === "drawn" ? [row.file, row.backend, row.camera, row.repeat, row.resolved] : null,
      ]),
    ],
    [
      "complete",
      { name: "duel", durationSeconds: 3, fps: 10, width: 64, height: 36 },
      "abc123",
      [
        ["subject", "duel"],
        ["at", "1,2"],
      ],
      ["sheet-001.png"],
      ["t001.000-film-beauty.png", "t002.000-film-beauty.png", "sheet-001.png", "record.json"],
      [
        ["t001.000-film-beauty", "drawn", "sheet-001.png", 0, 0, ["t001.000-film-beauty.png", "memory", "0,1,4:0,1,0", "0,1,4:0,1,0@ortho=0.01", [{ role: "parts", pattern: "hero", paths: ["hero"], count: 2 }]]],
        ["t002.000-film-beauty", "drawn", "sheet-001.png", 0, 1, ["t002.000-film-beauty.png", "memory", "0,1,4:0,1,0", "0,1,4:0,1,0@ortho=0.01", [{ role: "parts", pattern: "hero", paths: ["hero"], count: 2 }]]],
      ],
    ],
  );
  TestValidator.equals(
    "the written record is the returned one",
    JSON.parse(memory.text("out/duel/record.json")),
    JSON.parse(JSON.stringify(record)),
  );

  // 4. Hashes and labels.
  for (const row of record.rows) {
    if (row.state !== "drawn") continue;
    const still: IAutoMovieRasterImage = await decodeAutoMovieRasterPng(memory.files.get(`out/duel/${row.file}`)!);
    TestValidator.equals(`${row.name} hash`, row.hash, hashAutoMovieRasterImage(still));
    const at: (x: number, y: number) => number[] = (x: number, y: number): number[] =>
      Array.from(still.pixels.subarray((y * 64 + x) * 4, (y * 64 + x) * 4 + 3));
    TestValidator.equals(
      `${row.name} label boxes start at their anchor, or inside the edge`,
      [at(40, 20), at(57, 27), at(56, 27)[1]],
      [[16, 16, 16], [16, 16, 16], 200],
    );
  }

  // 5. A second capture replaces the first.
  await capture("at=0.5");
  TestValidator.equals(
    "only the second capture's files remain",
    [...memory.files.keys()].sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)),
    ["out/duel/record.json", "out/duel/sheet-001.png", "out/duel/t000.500-film-beauty.png"],
  );

  // 6. A folder opened for another round.
  const before: number = memory.log.length;
  let refused: boolean = false;
  try {
    await runAutoMovieCapture({
      plan: plan("at=1&round=r2"),
      draw,
      folder: await AutoMovieCaptureFolder.open({ storage: memory.storage, root: "out/duel", round: null, compare: null }),
      revision: "abc123",
      match: "cell",
    });
  } catch (error) {
    refused = error instanceof Error && error.message.includes("r2");
  }
  TestValidator.predicate("a folder of another round is refused", refused);
  TestValidator.predicate(
    "the refusal writes nothing",
    memory.log.slice(before).every((call: string): boolean => !call.startsWith("writeFile")),
  );

  // 7. The Node storage type-checks; it is never called.
  TestValidator.equals("node:fs/promises has every storage method", typeof NODE.writeFile, "function");
}
