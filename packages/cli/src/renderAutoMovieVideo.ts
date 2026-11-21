import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieDrawnVideoResult,
} from "@automovie/interface";
import type * as Render from "@automovie/render";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { AutoMovieCaptureHost } from "./AutoMovieCaptureHost";
import { readAutoMovieRevision } from "./readAutoMovieRevision";
import { runAutoMovieDeliveryDecode } from "./runAutoMovieDeliveryDecode";
import { runAutoMovieDeliveryReferenceDecode } from "./runAutoMovieDeliveryReferenceDecode";
import { runAutoMovieFfmpeg } from "./runAutoMovieFfmpeg";

type DeliveryAudit = IAutoMovieDeliveryContentAudit.IResult;

/** The render operations this host needs from a production's draw session. */
interface IDeliveryHost {
  render: Pick<
    typeof Render,
    "renderAutoMovieDrawnVideo" | "auditAutoMovieDeliveryContent"
  >;
  session(
    props: Parameters<AutoMovieCaptureHost["session"]>[0],
  ): Promise<
    Pick<Render.AutoMovieDrawSession, "backend" | "close" | "frame" | "subject">
  >;
}

/** Scene and encoded evidence from a single release attempt on the output directory. */
interface IDeliveryReport {
  subject: string;
  revision: ReturnType<typeof readAutoMovieRevision>;
  backend: string;
  status: "published" | "blocked" | "failed";
  video: "film.mp4" | null;
  args: readonly string[];
  frames: Pick<
    IAutoMovieDrawnVideoResult["frames"][number],
    "index" | "seconds" | "hash"
  >[];
  diagnostics: IAutoMovieDrawnVideoResult["diagnostics"] | null;
  delivery: DeliveryAudit | null;
  source: IAutoMovieDeliveryContentAudit.ISource | null;
  failure?: { phase: string; message: string };
}

/** Delivery encoding uses the drawn subject's own clock and raster. */
const SPEC: Parameters<typeof Render.renderAutoMovieDrawnVideo>[0]["spec"] = {
  target: "production",
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 18,
};

/** Defaults measure long enough intervals to distinguish them from a transient frame or sample. */
const THRESHOLDS: IAutoMovieDeliveryContentAudit.IThresholds = {
  black: {
    minimumDuration: { ticks: 1, timeBase: [1, 5] },
    minimumPictureRatio: 0.98,
    maximumPixelThreshold: 0.1,
  },
  frozen: {
    minimumDuration: { ticks: 1, timeBase: [1, 2] },
    maximumMeanDifference: 0.001,
  },
  silence: {
    minimumDuration: { ticks: 1, timeBase: [1, 2] },
    maximumAmplitude: 0.001,
  },
};

/**
 * Renders one subject and publishes an approved film beside its shared report.
 * Every measurable audit runs on the drawn frames or the exact staged encoded
 * bytes. A blocked attempt replaces the report and preserves the former film.
 * A failed encode still reports the frames and scene inspection already drawn.
 * If the approved film or its report cannot be installed, the former film is
 * put back, so the film and report on disk always come from the same attempt.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the measured sources, paths and refusal behavior.
 * @evidence contracts/development/implementation.md#principled-implementation Uses Render for drawing and auditing, hashes and decodes exactly one uniquely staged candidate, measures the encoder's own inputs the same way so drawn and encode-introduced intervals are told apart, and settles both verdicts before replacing any delivered bytes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reserves the output, renders, audits, stages the report and publishes, then releases owned resources.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Failed attempts carry their own report status and digest when measured. Confirmed findings and unresolved required checks prevent the candidate rename.
 * @evidence contracts/development/implementation.md#efficient-algorithms Uses one encode, one streamed hash, one video decode and an audio decode only when present, plus one decode of the drawn frames and one of the soundtrack the encoder read. PNG scratch is never copied into the delivery folder.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each render draws, encodes and decodes afresh, because every attempt stages its own candidate bytes.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the output reservation through both publication operations and releases the session and its unique staging folders on completion.
 */
export async function renderAutoMovieVideo(
  props: {
    /** The opened draw host. */
    host: IDeliveryHost;
    /** The production's root folder. */
    root: string;
    /** The subject's name, or null for the page's only subject. */
    subject: string | null;
    /** Data the subject module reads, as JSON, or null. */
    props: unknown;
    /** Output folder, relative to the root or absolute. */
    out?: string;
    /** FFmpeg executable. */
    ffmpeg: string;
  },
  run: typeof runAutoMovieFfmpeg = runAutoMovieFfmpeg,
): Promise<{ video: string; report: string; frames: number }> {
  const session = await props.host.session({
    subject: props.subject,
    props: props.props,
  });
  const { name, delivery: intent } = session.subject;
  const out = path.resolve(
    props.root,
    props.out ?? path.join("media", "automovie", name, "videos"),
  );
  const video = path.join(out, "film.mp4");
  const report = path.join(out, "render-report.json");
  const reservation = path.join(out, ".render-publish");
  let reservationTicket: string | undefined;
  let staging: string | undefined;
  let scratch: string | undefined;
  try {
    await fs.mkdir(out, { recursive: true });
    staging = await fs.mkdtemp(path.join(out, ".render-"));
    reservationTicket = await reserveOutput(staging, reservation, out);
    const candidate = path.join(staging, "film.mp4");
    const pendingReport = path.join(staging, "render-report.json");
    const attempt: IDeliveryReport = {
      subject: name,
      revision: readAutoMovieRevision(props.root),
      backend: session.backend,
      status: "failed",
      video: null,
      args: [],
      frames: [],
      diagnostics: null,
      delivery: null,
      source: null,
    };
    const writeReport = async (): Promise<void> =>
      fs.writeFile(pendingReport, JSON.stringify(attempt, null, 2) + "\n");
    let phase = "draw";
    const soundtrack: string | null = intent?.audio?.path ?? null;
    try {
      const frameRoot = path.join(props.root, ".cache", "render");
      await fs.mkdir(frameRoot, { recursive: true });
      scratch = await fs.mkdtemp(path.join(frameRoot, "frames-"));
      const result = await props.host.render.renderAutoMovieDrawnVideo({
        session,
        spec: SPEC,
        frameDir: scratch.split(path.sep).join("/"),
        outputPath: candidate,
        audio:
          soundtrack === null ? null : path.resolve(props.root, soundtrack),
        write: (file, data) => fs.writeFile(file, data),
        encode: async (args, drawn) => {
          attempt.args = args;
          attempt.frames = drawn.frames.map(({ index, seconds, hash }) => ({
            index,
            seconds,
            hash,
          }));
          attempt.diagnostics = drawn.diagnostics ?? null;
          phase = "encode";
          await run(props.ffmpeg, args);
        },
      });

      phase = "audit";
      const hash = createHash("sha256");
      for await (const chunk of createReadStream(candidate)) hash.update(chunk);
      attempt.source = {
        file: path.relative(out, candidate).split(path.sep).join("/"),
        sha256: hash.digest("hex"),
      };
      const expected = {
        frameCount: result.frames.length,
        frameRate: result.frameRate,
        audioRequired: intent?.audio?.required ?? false,
        contentRequired: intent !== undefined,
        ...(intent?.allowances === undefined
          ? {}
          : { allowances: intent.allowances }),
      };
      const thresholds = intent?.thresholds ?? THRESHOLDS;
      const streams = await runAutoMovieDeliveryDecode(
        props.ffmpeg,
        candidate,
        expected,
        thresholds,
        run,
      );
      // The drawn frames and the soundtrack as the encoder read them, measured
      // the same way, before the frame scratch is released.
      const reference = await runAutoMovieDeliveryReferenceDecode(
        props.ffmpeg,
        attempt.args,
        expected,
        thresholds,
        run,
      );
      attempt.delivery = props.host.render.auditAutoMovieDeliveryContent({
        source: attempt.source,
        expected,
        thresholds,
        streams,
        reference,
      });

      const failures = releaseFindings(attempt.diagnostics, attempt.delivery);
      if (failures.length > 0) {
        attempt.status = "blocked";
        throw new Error(failures.join(" | "));
      }

      phase = "publish";
      attempt.status = "published";
      attempt.video = "film.mp4";
      await writeReport();
      await publish({
        candidate,
        video,
        pendingReport,
        report,
        previous: path.join(staging, "previous.mp4"),
      });
      return { video, report, frames: result.frames.length };
    } catch (cause) {
      attempt.video = null;
      if (attempt.status !== "blocked") attempt.status = "failed";
      const message = cause instanceof Error ? cause.message : String(cause);
      attempt.failure = { phase, message };
      try {
        await writeReport();
        await fs.rename(pendingReport, report);
      } catch (reportFailure) {
        throw new AggregateError(
          [cause, reportFailure],
          "Render failed and could not publish " + report + ": " + message,
        );
      }
      throw new Error(
        "Render " + attempt.status + ": " + message + "\n" + report,
        { cause },
      );
    }
  } finally {
    await Promise.all([
      session.close(),
      ...(staging === undefined ? [] : [fs.rm(staging, { recursive: true })]),
      ...(scratch === undefined ? [] : [fs.rm(scratch, { recursive: true })]),
      ...(reservationTicket === undefined
        ? []
        : [releaseOutput(reservation, reservationTicket)]),
    ]);
  }
}

/**
 * Installs the approved film and then its report. The former film waits in
 * staging until both are in place; when either step fails it returns, so the
 * published film and report always belong to the same attempt.
 */
async function publish(paths: {
  candidate: string;
  video: string;
  pendingReport: string;
  report: string;
  previous: string;
}): Promise<void> {
  const kept = await fs
    .rename(paths.video, paths.previous)
    .then(() => true)
    .catch((error: unknown): false => {
      if (errorCode(error) !== "ENOENT") throw error;
      return false;
    });
  try {
    await fs.rename(paths.candidate, paths.video);
    await fs.rename(paths.pendingReport, paths.report);
  } catch (cause) {
    try {
      if (kept) await fs.rename(paths.previous, paths.video);
      else await fs.rm(paths.video, { force: true });
    } catch (restoreFailure) {
      throw new AggregateError(
        [cause, restoreFailure],
        "Publishing failed and the previous film could not be restored to " +
          paths.video,
      );
    }
    throw cause;
  }
}

/** Claims a destination with an atomically installed process ticket. */
async function reserveOutput(
  staging: string,
  reservation: string,
  out: string,
): Promise<string> {
  const pending = path.join(staging, "reservation");
  const ticket = "owner-" + process.pid + "-" + path.basename(staging);
  await fs.mkdir(pending);
  await fs.writeFile(path.join(pending, ticket), "");
  // Bound the number of races with another failed or completing reservation.
  for (let pass = 0; pass < 4; pass++) {
    try {
      await fs.rename(pending, reservation);
      return ticket;
    } catch (cause) {
      const entries = await fs
        .readdir(reservation)
        .catch((error: unknown): string[] => {
          if (errorCode(error) !== "ENOENT") throw cause;
          return [];
        });
      const owner = entries.length === 1 ? entries[0] : undefined;
      const pid = Number(
        /^owner-(\d+)-\.render-[a-z0-9]+$/iu.exec(owner ?? "")?.[1],
      );
      if (
        entries.length !== 0 &&
        (!Number.isSafeInteger(pid) || pid < 1 || processAlive(pid))
      )
        throw new Error("Another render has reserved " + out, { cause });
      if (owner !== undefined) await releaseOutput(reservation, owner);
      else await removeEmptyReservation(reservation);
    }
  }
  throw new Error(
    "Could not reserve " +
      out +
      " while another render changed its reservation",
  );
}

/** Treats a process as gone only when the operating system confirms it. */
function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (cause) {
    return !(
      cause instanceof Error &&
      "code" in cause &&
      cause.code === "ESRCH"
    );
  }
}

/** Removes the exact process ticket and only an empty reservation directory. */
async function releaseOutput(
  reservation: string,
  ticket: string,
): Promise<void> {
  await fs
    .unlink(path.join(reservation, ticket))
    .catch((error: unknown): void => {
      if (errorCode(error) !== "ENOENT") throw error;
    });
  await removeEmptyReservation(reservation);
}

/** Reads a Node file system error's code, if the value carries one. */
function errorCode(error: unknown): unknown {
  return error instanceof Error && "code" in error ? error.code : undefined;
}

/** A later invocation may already have installed its own ticket. */
async function removeEmptyReservation(reservation: string): Promise<void> {
  await fs.rmdir(reservation).catch((error: unknown): void => {
    const code: unknown = errorCode(error);
    if (code !== "ENOENT" && code !== "ENOTEMPTY" && code !== "EEXIST")
      throw error;
  });
}

/** Selects the first usable cursor in each audit while retaining complete details in the report. */
function releaseFindings(
  diagnostics: IDeliveryReport["diagnostics"],
  delivery: DeliveryAudit,
): string[] {
  const details: string[] = [];
  if (diagnostics?.hasBlockingFinding) {
    const blocking = diagnostics.episodes.find(
      ({ worst: { finding } }) =>
        finding.category === "error" && finding.confidence === "confirmed",
    );
    const first =
      blocking?.first.finding.category === "error" &&
      blocking.first.finding.confidence === "confirmed"
        ? blocking.first
        : blocking?.worst;
    details.push(
      first === undefined
        ? "Scene inspection failed"
        : first.finding.code +
            cursor(first.time.filmSeconds, first.time.outputFrame),
    );
  }
  if (diagnostics?.unresolvedRequiredCoverage) {
    const unresolved = diagnostics.coverage.find(
      ({ coverage }) =>
        coverage.required &&
        (coverage.status === "deferred" || coverage.status === "unsupported"),
    );
    details.push(
      unresolved === undefined
        ? "Required scene inspection coverage is unresolved"
        : "Required scene " +
            unresolved.coverage.check +
            " coverage is unresolved" +
            cursor(unresolved.first.filmSeconds, unresolved.first.outputFrame),
    );
  }

  for (const finding of delivery.findings) {
    if (!finding.blocking) continue;
    if (finding.kind !== "content") {
      details.push(finding.media + ": " + finding.reason);
      continue;
    }
    const {
      ticks,
      timeBase: [numerator, denominator],
    } = finding.start;
    details.push(
      finding.outcome +
        " " +
        finding.detector +
        cursor((ticks * numerator) / denominator, finding.firstOutputFrame),
    );
  }
  return details;
}

/** Formats the available output frame and film seconds without inventing an audio frame. */
function cursor(seconds: number, frame?: number): string {
  return (
    (frame === undefined ? "" : " at frame " + frame) + " (" + seconds + " s)"
  );
}
