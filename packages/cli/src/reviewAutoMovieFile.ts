import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMoviePlanVideoFramesProps,
} from "@automovie/interface";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { IAutoMovieReviewObservation } from "./IAutoMovieReviewObservation";
import { hashAutoMovieFile } from "./hashAutoMovieFile";
import { loadAutoMovieProductionModule } from "./loadAutoMovieProductionModule";
import { readAutoMovieErrorCode } from "./readAutoMovieErrorCode";
import { readAutoMovieReviewObservation } from "./readAutoMovieReviewObservation";
import type { readAutoMovieReviewOptions } from "./readAutoMovieReviewOptions";
import { resolveAutoMovieFfmpeg } from "./resolveAutoMovieFfmpeg";
import { runAutoMovieFfmpeg } from "./runAutoMovieFfmpeg";
import { sameAutoMovieReviewFile } from "./sameAutoMovieReviewFile";

/** The admitted file form of the review command. */
type FileOptions = Exclude<
  ReturnType<typeof readAutoMovieReviewOptions>,
  { url: string }
>;

/** Native clock terms verified by the successful delivery's continuous decode. */
interface IAutoMovieReviewClock {
  frameCount: number;
  timeBase: IAutoMovieDeliveryContentAudit.Ratio;
  ticksPerFrame: number;
}

/**
 * Create or explicitly rebind a review mark from a published film's verified
 * native clock. Replay extracts the exact original frame indices as stills with
 * adjacent context, after checking the current video bytes against the saved
 * digest. Returns the receipt and writes an actionable address.
 */
export async function reviewAutoMovieFile(props: {
  /** Admitted file review options. */
  options: FileOptions;
  /** The production root for user paths and project-installed packages. */
  root: string;
  /** Process environment used to resolve FFmpeg on replay. */
  env: Readonly<Record<string, string | undefined>>;
}): Promise<IAutoMovieReviewObservation> {
  const { options, root } = props;
  const previous: IAutoMovieReviewObservation | null =
    options.mark === null
      ? null
      : readAutoMovieReviewObservation(
          await json(path.resolve(root, options.mark)),
        );
  const file: string = path.resolve(root, options.file ?? previous!.file);
  const sha256: string = await hashAutoMovieFile(file).catch(
    (cause: unknown) => {
      if (previous === null || readAutoMovieErrorCode(cause) !== "ENOENT")
        throw cause;
      throw new Error(
        `Original review file is unavailable at ${file}. ${originalAddress(previous, null)}\n` +
          "Supply its archived copy with --file, or explicitly rebind using --file and --at or --from/--to.",
        { cause },
      );
    },
  );
  const out: string = path.resolve(
    root,
    options.out ?? path.join("media", "automovie", "review", randomUUID()),
  );

  if (options.requested === null) {
    if (sha256 !== previous!.sha256) {
      const replacement = await readPublishedReview(file, sha256).catch(
        (): null => null,
      );
      throw new Error(
        `Stale review file at ${file}. Expected SHA-256 ${previous!.sha256}. ` +
          `${originalAddress(previous!, replacement)}\n` +
          "Supply the original with --file, or explicitly rebind using --file and --at or --from/--to.",
      );
    }
    await replay({ ...props, out, file, mark: previous! });
    return previous!;
  }

  const report = await readPublishedReview(file, sha256);
  if (previous !== null && previous.subject !== report.subject)
    throw new Error(
      `Review rebind needs the same subject, ${previous.subject}, but this delivery reports ${report.subject}`,
    );

  const clock: IAutoMovieReviewClock | null = readClock(
    report.delivery,
    sha256,
  );
  const observed: IAutoMovieReviewObservation["observed"] =
    clock === null ? null : windowAt(clock, options.requested);
  const mark: IAutoMovieReviewObservation = {
    version: 1,
    subject: report.subject,
    file: relative(root, file),
    sha256,
    note: options.note ?? previous!.note,
    reviewer: options.reviewer,
    decision: options.decision,
    viewed: options.viewed,
    requested: options.requested,
    observed,
    unavailable:
      observed === null
        ? "The published report does not establish a continuous native video grid"
        : null,
    cut: resolveCut(report.cut, clock, observed),
    previous:
      options.mark === null
        ? null
        : relative(root, path.resolve(root, options.mark)),
  };
  readAutoMovieReviewObservation(mark);
  await fs.mkdir(out, { recursive: true });
  const receipt: string = path.join(out, "review.json");
  const handle: fs.FileHandle = await fs.open(receipt, "wx");
  try {
    await handle.writeFile(JSON.stringify(mark, null, 2) + "\n", "utf8");
  } catch (cause) {
    await handle.close();
    await fs.unlink(receipt);
    throw cause;
  }
  await handle.close();
  process.stdout.write(
    `review mark: ${receipt}\n${address(mark)}\n` +
      (mark.cut.state === "resolved"
        ? `cut: entry ${mark.cut.entry} (${mark.cut.shot})\n`
        : `cut: ${mark.cut.reason}\n`) +
      (previous === null ? "" : `${originalAddress(previous, report)}\n`),
  );
  return mark;
}

/** Verifies the render report corresponds to the current file. */
async function readPublishedReview(
  file: string,
  sha256: string,
): Promise<{ subject: string; delivery: unknown; cut: unknown }> {
  const report: unknown = await json(
    path.join(path.dirname(file), "render-report.json"),
  );
  if (
    !record(report) ||
    report.status !== "published" ||
    typeof report.video !== "string" ||
    path.basename(report.video) !== report.video ||
    typeof report.subject !== "string" ||
    report.subject.trim() === "" ||
    !record(report.source) ||
    report.source.sha256 !== sha256 ||
    !(await sameAutoMovieReviewFile(
      path.join(path.dirname(file), report.video),
      file,
    ))
  )
    throw new Error(
      `Review needs a published render-report.json matching the video name and SHA-256 beside ${file}`,
    );
  return {
    subject: report.subject,
    delivery: report.delivery,
    cut: report.cut,
  };
}

/** Reads the complete native grid already established on the same encoded bytes. */
function readClock(
  delivery: unknown,
  sha256: string,
): IAutoMovieReviewClock | null {
  if (
    !record(delivery) ||
    !record(delivery.source) ||
    delivery.source.sha256 !== sha256 ||
    !record(delivery.expected) ||
    !positiveInteger(delivery.expected.frameCount) ||
    !ratio(delivery.expected.frameRate) ||
    !record(delivery.streams) ||
    !record(delivery.streams.video)
  )
    return null;
  const video: Record<string, unknown> = delivery.streams.video;
  if (
    video.status !== "decoded" ||
    video.continuous !== true ||
    !record(video.start) ||
    !record(video.end) ||
    video.start.ticks !== 0 ||
    !positiveInteger(video.end.ticks) ||
    !ratio(video.start.timeBase) ||
    !ratio(video.end.timeBase) ||
    video.end.timeBase[0] !== video.start.timeBase[0] ||
    video.end.timeBase[1] !== video.start.timeBase[1]
  )
    return null;
  const count: number = delivery.expected.frameCount;
  const timeBase: IAutoMovieDeliveryContentAudit.Ratio = video.start.timeBase;
  const rate: IAutoMovieDeliveryContentAudit.Ratio =
    delivery.expected.frameRate;
  const ticksPerFrame: number = video.end.ticks / count;
  if (
    !Number.isSafeInteger(ticksPerFrame) ||
    BigInt(ticksPerFrame) * BigInt(timeBase[0]) * BigInt(rate[0]) !==
      BigInt(timeBase[1]) * BigInt(rate[1])
  )
    return null;
  return { frameCount: count, timeBase, ticksPerFrame };
}

/** Resolves a point or interval to the decoded frames intersecting its scope. */
function windowAt(
  clock: IAutoMovieReviewClock,
  requested: IAutoMovieReviewObservation["requested"],
): NonNullable<IAutoMovieReviewObservation["observed"]> {
  const end: number = seconds(clock, clock.frameCount);
  if (requested.from >= end || (requested.to !== null && requested.to > end))
    throw new Error(
      `Review position lies outside the published film's 0–${end} s`,
    );
  const firstBoundary: number = firstBoundaryAtOrAfter(clock, requested.from);
  const firstFrame: number =
    seconds(clock, firstBoundary) === requested.from
      ? firstBoundary
      : firstBoundary - 1;
  const endFrame: number =
    requested.to === null
      ? firstFrame + 1
      : firstBoundaryAtOrAfter(clock, requested.to);
  return {
    firstFrame,
    endFrame,
    frameCount: clock.frameCount,
    start: {
      ticks: firstFrame * clock.ticksPerFrame,
      timeBase: clock.timeBase,
    },
    end: { ticks: endFrame * clock.ticksPerFrame, timeBase: clock.timeBase },
  };
}

/** Finds the first native clock boundary at or above a film second. */
function firstBoundaryAtOrAfter(
  clock: IAutoMovieReviewClock,
  time: number,
): number {
  let first: number = 0;
  let last: number = clock.frameCount;
  while (first < last) {
    const middle: number = first + Math.floor((last - first) / 2);
    if (seconds(clock, middle) < time) first = middle + 1;
    else last = middle;
  }
  return first;
}

/**
 * Seconds relative to the published presentation zero, derived from native
 * ticks.
 */
function seconds(clock: IAutoMovieReviewClock, frame: number): number {
  return timestampSeconds({
    ticks: frame * clock.ticksPerFrame,
    timeBase: clock.timeBase,
  });
}

/** Seconds represented by an exact timestamp, for display and request lookup. */
function timestampSeconds(
  time: IAutoMovieDeliveryContentAudit.ITimestamp,
): number {
  return (time.ticks * time.timeBase[0]) / time.timeBase[1];
}

/** Identifies the one authored occurrence or exposes a cut boundary or overlap. */
function resolveCut(
  cut: unknown,
  clock: IAutoMovieReviewClock | null,
  observed: IAutoMovieReviewObservation["observed"],
): IAutoMovieReviewObservation["cut"] {
  if (
    !Array.isArray(cut) ||
    cut.length === 0 ||
    clock === null ||
    observed === null
  )
    return {
      state: "unavailable",
      reason: "No verified cut for this review window",
    };
  const start: number = seconds(clock, observed.firstFrame);
  const end: number = seconds(clock, observed.endFrame);
  let selected: { entry: number; shot: string } | null = null;
  let nextFrame: number = 0;
  let touching: number = 0;
  for (const entry of cut as unknown[]) {
    if (
      !record(entry) ||
      !whole(entry.entry) ||
      typeof entry.shot !== "string" ||
      entry.shot.trim() === "" ||
      !nonnegative(entry.start) ||
      !nonnegative(entry.played) ||
      !Array.isArray(entry.liveFrames) ||
      entry.liveFrames.length !== 2 ||
      !whole(entry.liveFrames[0]) ||
      !whole(entry.liveFrames[1]) ||
      entry.liveFrames[0] !== nextFrame ||
      entry.liveFrames[1] < nextFrame
    )
      return {
        state: "unavailable",
        reason: "The published cut is incomplete",
      };
    nextFrame = entry.liveFrames[1];
    if (entry.start < end && start < entry.start + entry.played) touching++;
    if (
      entry.liveFrames[0] <= observed.firstFrame &&
      observed.endFrame <= entry.liveFrames[1]
    )
      selected = { entry: entry.entry, shot: entry.shot };
  }
  if (nextFrame !== clock.frameCount)
    return {
      state: "unavailable",
      reason: "The published cut does not cover the decoded frames",
    };
  return selected === null || touching !== 1
    ? {
        state: "ambiguous",
        reason: "The marked window crosses an edit or transition",
      }
    : { state: "resolved", ...selected };
}

/**
 * Extracts a few adjacent stills from the verified original, using the file
 * capture planner.
 */
async function replay(props: {
  root: string;
  env: Readonly<Record<string, string | undefined>>;
  out: string;
  file: string;
  mark: IAutoMovieReviewObservation;
}): Promise<void> {
  const { mark, root, out, file } = props;
  process.stdout.write(`review source: ${file}\n${address(mark)}\n`);
  if (mark.observed === null) return;
  const { firstFrame, endFrame, frameCount } = mark.observed;
  const frames: number[] = [
    ...new Set([
      Math.max(0, firstFrame - 1),
      firstFrame,
      endFrame - 1,
      Math.min(frameCount - 1, endFrame),
    ]),
  ];
  const render: {
    planAutoMovieVideoFrames: (
      props: IAutoMoviePlanVideoFramesProps,
    ) => string[];
  } = loadAutoMovieProductionModule(root, "@automovie/render") as {
    planAutoMovieVideoFrames: (
      props: IAutoMoviePlanVideoFramesProps,
    ) => string[];
  };
  const ffmpeg: string = resolveAutoMovieFfmpeg({
    env: props.env,
    load: (id: string): unknown => loadAutoMovieProductionModule(root, id),
  });
  await fs.mkdir(out, { recursive: true });
  const directory: string = await fs.mkdtemp(path.join(out, "frames-"));
  try {
    await runAutoMovieFfmpeg(
      ffmpeg,
      render.planAutoMovieVideoFrames({ file, frames, directory }),
    );
    if ((await hashAutoMovieFile(file)) !== mark.sha256)
      throw new Error("The reviewed file changed during capture");
    const paths: string[] = frames.map((_: number, index: number): string =>
      path.join(directory, "s" + index.toString().padStart(5, "0") + ".png"),
    );
    for (const output of paths)
      if (!(await fs.stat(output)).isFile())
        throw new Error(`The decoder did not write ${output}`);
    process.stdout.write(
      paths
        .map(
          (output: string, index: number): string =>
            `frame ${frames[index]}: ${output}\n`,
        )
        .join(""),
    );
  } catch (cause) {
    await fs.rm(directory, { recursive: true });
    throw cause;
  }
}

/**
 * A short display address keeps the request distinct from native frame
 * coverage.
 */
function address(mark: IAutoMovieReviewObservation): string {
  const { requested, observed } = mark;
  const position: string =
    requested.to === null
      ? `requested ${requested.from} s`
      : `requested ${requested.from}–${requested.to} s`;
  return observed === null
    ? `${position}. ${mark.unavailable}`
    : `${position}. Frames ${observed.firstFrame}–${observed.endFrame - 1}, PTS ${observed.start.ticks}–${observed.end.ticks} at ${observed.start.timeBase.join("/")} s per tick`;
}

/** Reports the old address and any verified absence from a replacement cut. */
function originalAddress(
  old: IAutoMovieReviewObservation,
  replacement: { subject: string; cut: unknown } | null,
): string {
  const description = `Original ${old.file}. ${address(old)}.`;
  if (old.cut.state !== "resolved")
    return `${description} Cut: ${old.cut.reason}.`;
  const { entry, shot } = old.cut;
  const occurrence = `${description} Cut: entry ${entry} (${shot}).`;
  return replacement?.subject === old.subject &&
    Array.isArray(replacement.cut) &&
    replacement.cut.length > 0 &&
    replacement.cut.every(
      (item: unknown): boolean =>
        record(item) &&
        typeof item.shot === "string" &&
        item.shot.trim() !== "" &&
        item.shot !== shot,
    )
    ? `${occurrence} Shot ${shot} is absent from the replacement cut.`
    : occurrence;
}

/** Reads JSON with a useful filename on a missing or malformed record. */
async function json(file: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (cause) {
    throw new Error(`Could not read review evidence at ${file}`, { cause });
  }
}

/** Production-relative when possible, with stable slash syntax on disk. */
function relative(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join("/");
}

/** A decoded JSON object. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A positive safe integer clock term. */
function positiveInteger(value: unknown): value is number {
  return whole(value) && value > 0;
}

/** A nonnegative safe integer frame or occurrence index. */
function whole(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/** A finite nonnegative film second. */
function nonnegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Two positive whole terms of a native clock. */
function ratio(value: unknown): value is IAutoMovieDeliveryContentAudit.Ratio {
  return (
    Array.isArray(value) && value.length === 2 && value.every(positiveInteger)
  );
}
