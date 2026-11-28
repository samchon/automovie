import type {
  IAutoMovieCaptureCellRecord,
  IAutoMovieCaptureCompleteRecord,
  IAutoMovieDeliveryContentAudit,
} from "@automovie/interface";
import type * as Render from "@automovie/render";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { loadProductionModule } from "../../production/internal/loadProductionModule";
import type { AutoMovieCliCaptureTypes } from "../AutoMovieCliCaptureTypes";

/* Reopen only the original, still-verified bytes pinned by a complete capture. */
export async function readRetainedFrames(
  props: AutoMovieCliCaptureTypes.IReadRetainedFramesProps,
): Promise<AutoMovieCliCaptureTypes.IRetainedFrames> {
  const { fromFrame, endFrame, source } = props;
  const limit: number = props.limit ?? 32;
  if (
    ![fromFrame, endFrame, limit].every(Number.isSafeInteger) ||
    fromFrame < 0 ||
    endFrame <= fromFrame ||
    limit < 1 ||
    limit > 256
  )
    throw new Error(
      "Retained capture needs a nonempty native frame range and a limit from 1 through 256.",
    );
  if (source.type === "drawn") {
    if (
      typeof source.projectionKey !== "string" ||
      source.projectionKey.length === 0
    )
      throw new Error(
        "A retained drawn capture needs an exact projection key.",
      );
  } else if (
    source.type !== "video" ||
    !/^[a-f0-9]{64}$/u.test(source.fileSha256) ||
    !Number.isSafeInteger(source.streamIndex) ||
    source.streamIndex < 0
  )
    throw new Error(
      "A retained video capture needs an exact input digest and stream index.",
    );
  const recordFile: string = path.resolve(props.root, props.record);
  const recordBytes: Buffer = await fs.readFile(recordFile);
  if (digest(recordBytes) !== props.recordSha256)
    throw new Error(
      `Capture record ${recordFile} does not match its expected SHA-256.`,
    );
  const stored: IAutoMovieCaptureCompleteRecord = JSON.parse(
    recordBytes.toString("utf8"),
  ) as IAutoMovieCaptureCompleteRecord;
  if (
    stored?.state !== "complete" ||
    stored.subject?.name !== props.subject ||
    !Array.isArray(stored.rows)
  )
    throw new Error(
      `Capture record ${recordFile} does not describe the complete subject ${props.subject}.`,
    );

  const checkedClock: Map<
    number,
    IAutoMovieDeliveryContentAudit.ITimestamp
  > | null = source.type === "video" ? videoClock(stored, source) : null;
  if (source.type === "drawn" && stored.video !== null && stored.video !== undefined)
    throw new Error(
      "A decoded file capture cannot qualify as a drawn camera projection.",
    );
  const projectionKey:
    | typeof Render.AutoMovieRenderInspectionCamera.projectionKey
    | null =
    source.type === "drawn"
      ? loadProductionModule<typeof Render>(props.root, "@automovie/render")
          .AutoMovieRenderInspectionCamera.projectionKey
      : null;
  const stop: number = fromFrame + Math.min(limit, endFrame - fromFrame);
  const byFrame: Map<number, DrawnCell[]> = new Map();
  for (const row of stored.rows) {
    const index: number | null | undefined = row?.time?.frame;
    if (
      typeof index !== "number" ||
      !Number.isSafeInteger(index) ||
      index < fromFrame ||
      index >= stop ||
      row.state !== "drawn" ||
      row.view !== props.view ||
      row.pass !== props.pass
    )
      continue;
    if (
      source.type === "drawn" &&
      (projectionKey === null ||
        recordedKey(row.camera, projectionKey) !== source.projectionKey)
    )
      continue;
    const rows: DrawnCell[] = byFrame.get(index) ?? [];
    rows.push(row);
    byFrame.set(index, rows);
  }
  const frames: AutoMovieCliCaptureTypes.RetainedFrame[] = [];
  const directory: string = path.dirname(recordFile);
  for (let frame: number = fromFrame; frame < stop; ++frame)
    frames.push(
      await readPicture(
        directory,
        frame,
        byFrame.get(frame) ?? [],
        checkedClock,
      ),
    );
  return {
    requested: endFrame - fromFrame,
    truncated: stop < endFrame,
    frames,
  };
}

type DrawnCell = Extract<IAutoMovieCaptureCellRecord, { state: "drawn" }>;

function videoClock(
  stored: IAutoMovieCaptureCompleteRecord,
  source: AutoMovieCliCaptureTypes.IVideoSource,
): Map<number, IAutoMovieDeliveryContentAudit.ITimestamp> {
  const presentation = stored.video?.presentation;
  if (
    presentation?.type !== "decoded" ||
    presentation.fileSha256 !== source.fileSha256 ||
    !Number.isSafeInteger(presentation.streamIndex) ||
    presentation.streamIndex < 0 ||
    presentation.streamIndex !== source.streamIndex ||
    !Array.isArray(presentation.timeBase) ||
    presentation.timeBase.length !== 2 ||
    !presentation.timeBase.every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    !Array.isArray(presentation.frames)
  )
    throw new Error(
      "The retained record has no exact decoder clock for the expected file and stream.",
    );
  const clock: Map<number, IAutoMovieDeliveryContentAudit.ITimestamp> =
    new Map();
  for (const frame of presentation.frames) {
    if (
      !Number.isSafeInteger(frame.frame) ||
      frame.frame < 0 ||
      !Number.isSafeInteger(frame.ticks) ||
      clock.has(frame.frame)
    )
      throw new Error(
        "The retained decoder clock contains an invalid or duplicate native frame.",
      );
    clock.set(frame.frame, {
      ticks: frame.ticks,
      timeBase: presentation.timeBase,
    });
  }
  return clock;
}

function recordedKey(
  camera: string | null,
  key: typeof Render.AutoMovieRenderInspectionCamera.projectionKey,
): string | null {
  if (camera === null) return null;
  try {
    return key(JSON.parse(camera)?.projectionIdentity);
  } catch {
    return null;
  }
}

async function readPicture(
  directory: string,
  frame: number,
  rows: readonly DrawnCell[],
  clock: ReadonlyMap<number, IAutoMovieDeliveryContentAudit.ITimestamp> | null,
): Promise<AutoMovieCliCaptureTypes.RetainedFrame> {
  const unavailable = (
    reason: string,
  ): AutoMovieCliCaptureTypes.IUnavailableFrame => ({
    type: "unavailable",
    frame,
    reason,
  });
  if (rows.length !== 1)
    return unavailable(
      rows.length === 0
        ? "No still matched the view, pass and source."
        : "More than one still matched the requested frame.",
    );
  const presentation = clock?.get(frame);
  if (clock !== null && presentation === undefined)
    return unavailable("The selected frame has no exact decoder timestamp.");
  const row: DrawnCell = rows[0]!;
  if (
    typeof row.file !== "string" ||
    !/^[^/\\:]+\.png$/u.test(row.file) ||
    row.fileSha256 === undefined
  )
    return unavailable(
      "The still does not have a local PNG name and byte digest.",
    );
  const file: string = path.join(directory, row.file);
  try {
    const bytes: Buffer = await fs.readFile(file);
    if (digest(bytes) !== row.fileSha256)
      return unavailable("The stored PNG does not match its byte digest.");
    return {
      type: "retained",
      frame,
      file,
      fileSha256: row.fileSha256,
      bytes,
      ...(presentation === undefined ? {} : { presentation }),
    };
  } catch {
    return unavailable("The stored PNG could not be read.");
  }
}

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
