import type {
  IAutoMovieControlRecord,
  IAutoMovieDeliveryContentAudit,
  IAutoMovieDrawnVideoResult,
} from "@automovie/interface";
import type * as Render from "@automovie/render";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { AutoMovieCaptureHost } from "./AutoMovieCaptureHost";
import { AutoMovieRenderOutputReservation } from "./AutoMovieRenderOutputReservation";
import type { IAutoMovieDeliveryProfileFinding } from "./IAutoMovieDeliveryProfileFinding";
import { auditAutoMovieDeliveryProfile } from "./auditAutoMovieDeliveryProfile";
import { publishAutoMovieRenderAttempt } from "./publishAutoMovieRenderAttempt";
import { readAutoMovieRevision } from "./readAutoMovieRevision";
import { runAutoMovieDeliveryDecode } from "./runAutoMovieDeliveryDecode";
import { runAutoMovieDeliveryReferenceDecode } from "./runAutoMovieDeliveryReferenceDecode";
import { runAutoMovieFfmpeg } from "./runAutoMovieFfmpeg";

type DeliveryAudit = IAutoMovieDeliveryContentAudit.IResult;

/** The render operations this host needs from a production's draw session. */
interface IDeliveryHost {
  render: Pick<
    typeof Render,
    | "renderAutoMovieDrawnVideo"
    | "auditAutoMovieDeliveryContent"
    | "AUTOMOVIE_MP4_SRGB_COLOUR"
    | "assertProductionAacProfile"
    | "assertProductionVideoProfile"
    | "resolveProductionVideoProfile"
  >;
  session(
    props: Parameters<AutoMovieCaptureHost["session"]>[0],
  ): Promise<
    Pick<Render.AutoMovieDrawSession, "backend" | "close" | "frame" | "subject">
  >;
}

/**
 * Scene and encoded evidence from a single release attempt on the output
 * directory.
 */
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
  /**
   * The soundtrack mixed from the subject's sound list: its digest, each line's
   * PCM digest and the master's measurements.
   */
  sound: IAutoMovieDrawnVideoResult["sound"] | null;
  /**
   * The film's cut, one row per sequence entry with the output frames it is
   * live in; absent when the subject supplied no cut. It describes the
   * `film.mp4` beside this report only when `status` is `published` and
   * `source.sha256` is that file's digest.
   */
  cut?: IAutoMovieDrawnVideoResult["cut"];
  delivery: DeliveryAudit | null;
  /**
   * How the encoded file differs from its video and audio profiles; empty when
   * it conforms, null when not checked.
   */
  profile: IAutoMovieDeliveryProfileFinding[] | null;
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

/**
 * Defaults measure long enough intervals to distinguish them from a transient
 * frame or sample.
 */
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
 * bytes. The encoded file must also carry its declared picture profile and,
 * with a soundtrack, the AAC profile, or no audio track without one
 * (`auditAutoMovieDeliveryProfile`); a mismatch blocks like a blocking audit
 * finding and the report's `profile` records each field with its expected and
 * observed values. A blocked attempt replaces the report and preserves the
 * former film. A failed encode still reports the frames and scene inspection
 * already drawn. If the approved film or its report cannot be installed, the
 * former film is put back, so the film and report on disk always come from the
 * same attempt.
 *
 * With `passes`, every frame is also drawn in those guide passes and written
 * under `<out>/controls/` with `record.json`, whose `filmSha256` is the
 * report's `source.sha256`; the folder is staged and installed in the same
 * publish step as the film, so a blocked or failed attempt keeps the former
 * `controls/` with the former film.
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
    /**
     * Guide passes other than `beauty` drawn at every frame into
     * `<out>/controls/`; absent or empty draws the film alone.
     */
    passes?: readonly string[];
  },
  run: typeof runAutoMovieFfmpeg = runAutoMovieFfmpeg,
): Promise<{
  video: string;
  report: string;
  frames: number;
  controls: string | null;
}> {
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
    reservationTicket = await AutoMovieRenderOutputReservation.reserve(
      staging,
      reservation,
      out,
    );
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
      sound: null,
      delivery: null,
      profile: null,
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

      // Control frames are staged beside the film and published with it,
      // inside the output folder whose publish lock this attempt holds.
      const controls =
        (props.passes ?? []).length === 0
          ? null
          : {
              staged: path.join(staging, "controls"),
              installed: path.join(out, "controls"),
            };
      if (controls !== null) await fs.mkdir(controls.staged);
      const result = await props.host.render.renderAutoMovieDrawnVideo({
        session,
        spec: SPEC,
        frameDir: scratch.split(path.sep).join("/"),
        outputPath: candidate,
        ...(controls === null
          ? {}
          : {
              controls: {
                passes: props.passes ?? [],
                frameDir: controls.staged.split(path.sep).join("/"),
              },
            }),
        audio:
          soundtrack === null ? null : path.resolve(props.root, soundtrack),
        write: (file, data) => fs.writeFile(file, data),
        read: async (file) => fs.readFile(path.resolve(props.root, file)),
        encode: async (args, drawn) => {
          attempt.args = args;
          // The soundtrack lives in the frame scratch, which is released, so
          // the report names it by file name beside its digest.
          attempt.sound =
            drawn.sound === undefined
              ? null
              : { ...drawn.sound, file: path.posix.basename(drawn.sound.file) };
          attempt.frames = drawn.frames.map(({ index, seconds, hash }) => ({
            index,
            seconds,
            hash,
          }));
          attempt.diagnostics = drawn.diagnostics ?? null;
          if (drawn.cut !== undefined) attempt.cut = drawn.cut;
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

      // The file must carry the picture and sound profiles its types declare;
      // the encoder muxed a soundtrack exactly when it had a second input.
      attempt.profile = await auditAutoMovieDeliveryProfile({
        render: props.host.render,
        path: candidate,
        width: session.subject.width,
        height: session.subject.height,
        frameRate: result.frameRate,
        audio: attempt.args.indexOf("-i", attempt.args.indexOf("-i") + 2) >= 0,
      });

      const failures = [
        ...releaseFindings(attempt.diagnostics, attempt.delivery),
        ...attempt.profile.map(
          (finding: IAutoMovieDeliveryProfileFinding): string =>
            `unsupported-${finding.media}-profile.${finding.field}: expected ${finding.expected}, observed ${finding.observed}`,
        ),
      ];
      if (failures.length > 0) {
        attempt.status = "blocked";
        throw new Error(failures.join(" | "));
      }

      phase = "publish";
      attempt.status = "published";
      attempt.video = "film.mp4";
      await writeReport();
      if (controls !== null)
        await writeControlRecord(controls.staged, {
          film: name,
          revision: attempt.revision,
          backend: attempt.backend,
          clock: {
            frameRate: result.frameRate,
            frameCount: result.frames.length,
            width: session.subject.width,
            height: session.subject.height,
          },
          filmSha256: attempt.source.sha256,
          channels: result.controls ?? [],
        });
      await publishAutoMovieRenderAttempt({
        candidate,
        video,
        pendingReport,
        report,
        previous: path.join(staging, "previous.mp4"),
        ...(controls === null
          ? {}
          : {
              controls: {
                candidate: controls.staged,
                installed: controls.installed,
                previous: path.join(staging, "previous-controls"),
              },
            }),
      });
      return {
        video,
        report,
        frames: result.frames.length,
        controls: controls === null ? null : controls.installed,
      };
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
        : [
            AutoMovieRenderOutputReservation.release(
              reservation,
              reservationTicket,
            ),
          ]),
    ]);
  }
}

/**
 * Writes a control folder's `record.json`, the file a generation request names
 * and a manifest digests.
 */
async function writeControlRecord(
  folder: string,
  record: IAutoMovieControlRecord,
): Promise<void> {
  await fs.writeFile(
    path.join(folder, "record.json"),
    JSON.stringify(record, null, 2) + "\n",
  );
}

/**
 * Selects the first usable cursor in each audit while retaining complete
 * details in the report.
 */
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

/**
 * Formats the available output frame and film seconds without inventing an
 * audio frame.
 */
function cursor(seconds: number, frame?: number): string {
  return (
    (frame === undefined ? "" : " at frame " + frame) + " (" + seconds + " s)"
  );
}
