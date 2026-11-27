import type {
  IAutoMovieControlRecord,
  IAutoMovieDeliveryContentAudit,
  IAutoMovieDialogueLipSync,
  IAutoMovieDrawnVideoResult,
} from "@automovie/interface";
import type * as Render from "@automovie/render";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { AutoMovieCliRender } from "../AutoMovieCliRender";
import { AutoMovieRenderOutputReservation } from "../../AutoMovieRenderOutputReservation";
import type { IAutoMovieDeliveryProfileFinding } from "../../IAutoMovieDeliveryProfileFinding";
import { auditAutoMovieAlphaSamples } from "../../auditAutoMovieAlphaSamples";
import { auditAutoMovieDeliveryProfile } from "../../delivery/internal/auditAutoMovieDeliveryProfile";
import { AutoMovieCliDelivery } from "../../delivery/AutoMovieCliDelivery";
import { listAutoMovieReleaseFindings } from "../../listAutoMovieReleaseFindings";
import { publishAutoMovieRenderAttempt } from "../../publishAutoMovieRenderAttempt";
import { readAutoMovieRevision } from "../../production/internal/readAutoMovieRevision";
import { runAutoMovieFfmpeg } from "../../ffmpeg/internal/runAutoMovieFfmpeg";

/**
 * Renders one subject and publishes an approved film beside its shared report.
 * Every measurable audit runs on the drawn frames or the exact staged encoded
 * bytes. The decoded audio's integrated loudness and true peak, measured by the
 * production render's BS.1770-5 meter, must meet the targets the sound-list mix
 * applied or, for a supplied soundtrack, the declared loudness intent, and a
 * phoneme-driven line whose lip-sync lag, measured against the mouth the
 * subject read on each drawn frame, fails the report's verdict blocks. The
 * encoded file must also carry its declared picture profile and, with a
 * soundtrack, the AAC profile, or no audio track without one
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
 *
 * With `background` `transparent`, the beauty pass is drawn over a transparent
 * background and its straight-alpha PNG files are wrapped unencoded into
 * `film.mov` in `media/automovie/<film>/transparent` by default, so a layer
 * attempt never replaces the film's report. The layer carries no audio: the
 * film's required soundtrack is not expected, none is passed to the wrap and
 * the report's `layer` says so. The black check, which reads a transparent
 * frame as black, does not block; the profile check is replaced by
 * `auditAutoMovieAlphaSamples`, which requires one sample per drawn frame with
 * the frame file's bytes.
 */
export async function renderAutoMovieVideo(
  props: AutoMovieCliRender.IRenderVideoInput,
  run: typeof runAutoMovieFfmpeg = runAutoMovieFfmpeg,
): Promise<AutoMovieCliRender.IRenderVideoResult> {
  const session = await props.host.session({
    subject: props.subject,
    props: props.props,
  });
  const { name, delivery: intent } = session.subject;

  // A transparent layer has its own folder, so its attempts never replace the
  // report of the film in `videos/`.
  const transparent: boolean = props.background === "transparent";
  const file: "film.mp4" | "film.mov" = transparent ? "film.mov" : "film.mp4";
  const out = path.resolve(
    props.root,
    props.out ??
      path.join(
        "media",
        "automovie",
        name,
        transparent ? "transparent" : "videos",
      ),
  );
  const video = path.join(out, file);
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
    const candidate = path.join(staging, file);
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
      ...(transparent
        ? {
            layer: {
              background: "transparent" as const,
              audio: "none" as const,
            },
          }
        : {}),
    };
    const writeReport = async (): Promise<void> =>
      fs.writeFile(pendingReport, JSON.stringify(attempt, null, 2) + "\n");
    let phase = "draw";
    const soundtrack: string | null = transparent
      ? null
      : (intent?.audio?.path ?? null);
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
      const result = await props.host.render.AutoMovieRenderVideo.renderDrawnVideo({
        session,
        spec: SPEC,
        frameDir: scratch.split(path.sep).join("/"),
        outputPath: candidate,
        ...(transparent ? { background: "transparent" as const } : {}),
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
      // The decoded audio meets the targets the mix applied (the production's
      // own or EBU R 128), or the production's own for a supplied soundtrack.
      const loudness =
        attempt.sound?.loudness.intent ?? intent?.loudness ?? undefined;
      const expected = {
        frameCount: result.frames.length,
        frameRate: result.frameRate,
        audioRequired: transparent ? false : (intent?.audio?.required ?? false),
        contentRequired: intent !== undefined,
        ...(intent?.allowances === undefined
          ? {}
          : { allowances: intent.allowances }),
        ...(loudness === undefined ? {} : { loudness }),
      };
      const thresholds = intent?.thresholds ?? THRESHOLDS;
      const streams = await AutoMovieCliDelivery.decode(
        props.ffmpeg,
        candidate,
        expected,
        thresholds,
        run,
        props.host.render.createAutoMovieLoudnessMeter,
      );
      // The drawn frames and the soundtrack as the encoder read them, measured
      // the same way, before the frame scratch is released.
      const reference = await AutoMovieCliDelivery.referenceDecode(
        props.ffmpeg,
        attempt.args,
        expected,
        thresholds,
        run,
      );
      attempt.delivery = props.host.render.AutoMovieRenderDelivery.auditContent({
        source: attempt.source,
        expected,
        thresholds,
        streams,
        reference,
      });

      // The file must carry the picture and sound profiles its types declare;
      // the encoder muxed a soundtrack exactly when it had a second input.
      // A transparent layer instead holds each drawn PNG file as one sample.
      attempt.profile = transparent
        ? await auditAutoMovieAlphaSamples({
            path: candidate,
            frames: result.frames.map(({ file }) => file),
          })
        : await auditAutoMovieDeliveryProfile({
            render: props.host.render,
            path: candidate,
            width: session.subject.width,
            height: session.subject.height,
            frameRate: result.frameRate,
            audio:
              attempt.args.indexOf("-i", attempt.args.indexOf("-i") + 2) >= 0,
          });

      const failures = [
        ...listAutoMovieReleaseFindings(
          attempt.diagnostics,
          attempt.delivery,
          transparent ? ["black"] : [],
        ),
        ...attempt.profile.map(
          (finding: IAutoMovieDeliveryProfileFinding): string =>
            `unsupported-${finding.media}-profile.${finding.field}: expected ${finding.expected}, observed ${finding.observed}`,
        ),
        // A phoneme-driven line whose sound and mouth part by more than the
        // detectability window blocks; unmeasured and inconclusive lines are
        // only reported.
        ...(attempt.sound?.lipSync ?? []).flatMap(
          (entry: IAutoMovieDialogueLipSync): string[] =>
            entry.status === "measured" && entry.verdict === "fail"
              ? [
                  `lip-sync ${entry.line}: the sound is ${entry.lagMilliseconds.toFixed(1)} ms after the mouth, outside -45 to +125 ms`,
                ]
              : [],
        ),
      ];
      if (failures.length > 0) {
        attempt.status = "blocked";
        throw new Error(failures.join(" | "));
      }

      phase = "publish";
      attempt.status = "published";
      attempt.video = file;
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
        previous: path.join(staging, "previous-" + file),
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

type DeliveryAudit = IAutoMovieDeliveryContentAudit.IResult;

/**
 * Scene and encoded evidence from a single release attempt on the output
 * directory.
 */
interface IDeliveryReport {
  /** The rendered subject's name. */
  subject: string;

  /** The production's source revision, as `readAutoMovieRevision` reads it. */
  revision: ReturnType<typeof readAutoMovieRevision>;

  /** The draw session's backend. */
  backend: string;

  /**
   * `published` when the film beside the report is this attempt's, `blocked`
   * when an audit refused it, `failed` when a phase threw.
   */
  status: "published" | "blocked" | "failed";

  /** The file this attempt published beside the report; null unless published. */
  video: "film.mp4" | "film.mov" | null;

  /**
   * Present for a transparent render: its `film.mov` is a layer with straight
   * alpha and writes no audio track, because the film it is composited into
   * keeps the soundtrack.
   */
  layer?: { background: "transparent"; audio: "none" };

  /** The FFmpeg arguments of the encode; empty until drawing finished. */
  args: readonly string[];

  /** Each drawn frame's index, film second and pixel hash. */
  frames: Pick<
    IAutoMovieDrawnVideoResult["frames"][number],
    "index" | "seconds" | "hash"
  >[];

  /** The scene inspection over every drawn frame; null until drawing finished. */
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

  /**
   * The content audit of the decoded file against the drawn frames and the
   * encoded soundtrack; null until the audit ran.
   */
  delivery: DeliveryAudit | null;

  /**
   * How the encoded file differs from its video and audio profiles; empty when
   * it conforms, null when not checked.
   */
  profile: IAutoMovieDeliveryProfileFinding[] | null;

  /** The staged encoded file and its SHA-256; null until the audit ran. */
  source: IAutoMovieDeliveryContentAudit.ISource | null;

  /** The phase that blocked or failed and its message; absent when published. */
  failure?: { phase: string; message: string };
}

/** Delivery encoding uses the drawn subject's own clock and raster. */
const SPEC: Parameters<typeof Render.AutoMovieRenderVideo.renderDrawnVideo>[0]["spec"] = {
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
