import { decodeAutoMovieRasterPng } from "../picture/decodeAutoMovieRasterPng.js";
import { formatAutoMovieInspectionRequest } from "../scene/inspection/formatAutoMovieInspectionRequest.js";
import { AutoMovieCaptureFolder } from "./AutoMovieCaptureFolder.js";
import type { IAutoMovieCaptureCell } from "./IAutoMovieCaptureCell.js";
import type { IAutoMovieCaptureDrawing } from "./IAutoMovieCaptureDrawing.js";
import type { IAutoMovieCapturePlan } from "./IAutoMovieCapturePlan.js";
import type { IAutoMovieCapturePlanRequest } from "./IAutoMovieCapturePlanRequest.js";
import type { IAutoMovieCaptureRecord } from "./IAutoMovieCaptureRecord.js";
import type { IAutoMovieCaptureStorage } from "./IAutoMovieCaptureStorage.js";
import type { IAutoMovieCaptureSubject } from "./IAutoMovieCaptureSubject.js";
import { planAutoMovieCapture } from "./planAutoMovieCapture.js";
import { planAutoMovieVideoFrames } from "./planAutoMovieVideoFrames.js";
import { planAutoMovieVideoSceneCuts } from "./planAutoMovieVideoSceneCuts.js";
import { readAutoMovieVideoSceneCuts } from "./readAutoMovieVideoSceneCuts.js";
import { runAutoMovieCapture } from "./runAutoMovieCapture.js";

/** The view name a file's cells are drawn through: the file itself. */
const FILE_VIEW: string = "file";

/** The report the scene-cut detection writes, deleted once read. */
const REPORT: string = "scenecut.txt";

/** The renderer a file's still is recorded as coming from: FFmpeg decoded it. */
const BACKEND: string = "ffmpeg";

/**
 * Capture an encoded or generated video file as stills of its own frames: the frames around every cut the file holds and every event the request names, beside an even sampling, through the same folder, sheets, record and comparison as a drawn capture.
 *
 * The steps, each through the injected storage and process runner:
 *
 * 1. Plan the request against the file's clock with no cuts, refusing what the file cannot give before the folder is touched.
 * 2. Open the folder, run `planAutoMovieVideoSceneCuts` at `request.threshold`, read the report with `readAutoMovieVideoSceneCuts` and delete it.
 * 3. Plan again with the cuts, so every frame within `request.window` frames of a cut is planned as an event's are.
 * 4. Run `planAutoMovieVideoFrames` for the planned frames, then let `runAutoMovieCapture` read each extracted still as its cell's picture, delete the extracted file and write the still under the cell's name.
 *
 * Each still is captioned by its frame index and second. A planned frame the file does not hold, as when the file is shorter than its stated duration, is a failed cell with the cause, and a comparison against the source's round at `time` matching reports it unmatched. The record lists the file, the threshold and every detected cut with its score, so a file with no cut records zero cuts at the threshold used.
 *
 * It rejects a request that asks for views, passes, a sweep or an inspection, since a file's pixels are drawn already, and explicit seconds that fall between the file's frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every step and its order, what a still is captioned by, what a missing frame becomes, what the record adds, and every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/capture.md`: around every cut and decisive instant capture the output's own consecutive frames, and sample a file from the file itself at the same seconds as its source. Frames are selected by index, so each still is a frame the file holds, and the source pairing is the round comparison's `time` matching.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan, detect cuts, plan again, extract, then the shared capture run; FFmpeg's arguments, the report reader and the frame plan each belong to their own function.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A frame missing from the file is recorded as a failure, never filled from a neighbour, and a still keeps the file's decoded pixels.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two FFmpeg runs decode the file twice, once for cuts and once for the frames; each extracted still is read, decoded and encoded once.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each run detects and extracts afresh, because the file may have changed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Extracted stills wait in the folder, claimed by its record, and each is deleted once read; one decoded still is held at a time.
 */
export async function runAutoMovieVideoCapture(props: {
  /** Path of the video file, as the process runner reads it. */
  file: string;

  /** The file's clock and raster, which the host knows from its source or a probe. */
  subject: Pick<
    IAutoMovieCaptureSubject,
    "name" | "durationSeconds" | "fps" | "width" | "height"
  >;

  /** What the capture asks for. */
  request: IAutoMovieCapturePlanRequest;

  /** Where files are read and written. */
  storage: IAutoMovieCaptureStorage;

  /** The capture's root folder. */
  root: string;

  /** Runs FFmpeg with the given arguments and resolves when it ends successfully. */
  run: (args: readonly string[]) => Promise<void>;

  /** Source revision the host captures from. */
  revision: string;
}): Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> {
  // 1. What a file cannot give is refused before the folder is touched.
  const { request } = props;
  if (
    request.views.join(";") !== "film" ||
    request.passes.length !== 1 ||
    request.sweep !== null ||
    formatAutoMovieInspectionRequest(request.inspection).length !== 0
  )
    throw new Error(
      "A video file's capture takes no views, passes, sweep or inspection: its pixels are drawn already",
    );
  const subject: IAutoMovieCaptureSubject = {
    ...props.subject,
    views: [FILE_VIEW],
    drawables: [],
    marks: [],
  };
  const fileRequest: IAutoMovieCapturePlanRequest = {
    ...request,
    views: [FILE_VIEW],
  };
  const plan: (cuts: readonly number[]) => IAutoMovieCapturePlan = (
    cuts: readonly number[],
  ): IAutoMovieCapturePlan => {
    const planned: IAutoMovieCapturePlan = planAutoMovieCapture({
      request: fileRequest,
      subject,
      cuts,
    });
    const between: IAutoMovieCaptureCell | undefined = planned.cells.find(
      (cell: IAutoMovieCaptureCell): boolean => cell.time.frame === null,
    );
    if (between !== undefined)
      throw new Error(
        `Second ${between.time.seconds} falls between the frames of ${props.file}`,
      );
    return planned;
  };
  plan([]);

  // 2. Detect the cuts.
  const folder: AutoMovieCaptureFolder = await AutoMovieCaptureFolder.open({
    storage: props.storage,
    root: props.root,
    round: request.round,
    compare: request.compare,
  });
  await folder.claim([REPORT]);
  await props.run(
    planAutoMovieVideoSceneCuts({
      file: props.file,
      report: `${folder.directory}/${REPORT}`,
      threshold: request.threshold,
    }),
  );
  const cuts: { seconds: number; score: number }[] =
    readAutoMovieVideoSceneCuts(
      new TextDecoder().decode(await folder.read(REPORT)),
    );
  await folder.remove(REPORT);

  // 3. Plan with the cuts, keeping only those within the file's stated duration.
  const planned: IAutoMovieCapturePlan = plan(
    cuts
      .map((cut: { seconds: number; score: number }): number => cut.seconds)
      .filter((seconds: number): boolean => seconds <= subject.durationSeconds),
  );

  // 4. Extract the planned frames, then capture them as cells.
  const extracted: Map<number, string> = new Map(
    planned.times.map(
      (time: { frame: number | null }, index: number): [number, string] => [
        time.frame!,
        `s${String(index).padStart(5, "0")}.png`,
      ],
    ),
  );
  await folder.claim([...extracted.values()]);
  await props.run(
    planAutoMovieVideoFrames({
      file: props.file,
      frames: [...extracted.keys()],
      directory: folder.directory,
    }),
  );
  return runAutoMovieCapture({
    plan: planned,
    folder,
    revision: props.revision,
    match: "time",
    video: { file: props.file, threshold: request.threshold, cuts },
    draw: async (
      cell: IAutoMovieCaptureCell,
    ): Promise<IAutoMovieCaptureDrawing> => {
      const name: string = extracted.get(cell.time.frame!)!;
      let bytes: Uint8Array;
      try {
        bytes = await folder.read(name);
      } catch (error) {
        throw new Error(
          `${props.file} has no frame ${cell.time.frame}: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
      await folder.remove(name);
      return {
        picture: await decodeAutoMovieRasterPng(bytes),
        labels: [],
        backend: BACKEND,
      };
    },
  });
}
