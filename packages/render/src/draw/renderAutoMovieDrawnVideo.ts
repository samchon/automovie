import type {
  IAutoMovieDrawnPass,
  IAutoMovieDrawnVideoResult,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieRenderSpec,
} from "@automovie/interface";

import { planAutoMovieVideoEncoding } from "../delivery/planAutoMovieVideoEncoding.js";
import { frameName } from "../frameName.js";
import { frameTimes } from "../frameTimes.js";
import { encodeAutoMovieRasterPng } from "../picture/encodeAutoMovieRasterPng.js";
import { hashAutoMovieRasterImage } from "../picture/hashAutoMovieRasterImage.js";
import { reduceAutoMovieInspectionEpisodes } from "../scene/inspection/reduceAutoMovieInspectionEpisodes.js";
import type { AutoMovieDrawSession } from "./AutoMovieDrawSession.js";

/**
 * Render a drawn subject into one video: draw every frame of its clock through
 * the draw page's function, write each as a PNG, then encode them once.
 *
 * The clock and raster are the subject's, read from the session, so the spec
 * takes no frame format. The encoding is admitted and planned by
 * `planAutoMovieVideoEncoding` before the first frame is drawn, so a clock that
 * is not a whole number of frames or an odd raster costs no drawing. Frame `i`
 * is drawn at `frameTimes`' second `i / fps` in the `beauty` pass through the
 * subject's own camera, and written as `<frameDir>/frame_<i>.png`; frames are
 * drawn and written one at a time, in order. The encoder then runs once with
 * the planned arguments. When a frame supplies diagnostics, the output clock
 * binds the sample to that frame and the audit reports coverage against the
 * full schedule.
 *
 * Files and processes are the host's: `write` stores a file and `encode` runs
 * FFmpeg, so the order of every step runs under a unit test. `encode` is handed
 * the frame receipts and scene audit with its arguments, so they survive an
 * encoder failure. A draw, write or encode failure rejects at once and leaves
 * the files written so far to the host.
 */
export async function renderAutoMovieDrawnVideo(props: {
  /** The opened draw session of the subject. */
  session: Pick<AutoMovieDrawSession, "subject" | "frame">;

  /** Encoding controls; the frame format is the subject's clock and raster. */
  spec: Omit<IAutoMovieRenderSpec, "frameFormat">;

  /** Folder the frame files are written into. */
  frameDir: string;

  /** The video file the encoder writes. */
  outputPath: string;

  /** A complete soundtrack to mux, or null for none. */
  audio: string | null;

  /** Store one file whole. */
  write: (path: string, data: Uint8Array) => Promise<void>;

  /**
   * Run FFmpeg with the arguments, resolving once it succeeded. It also
   * receives the drawn frames and scene audit, already complete, so a host can
   * keep them when encoding fails.
   */
  encode: (
    args: readonly string[],
    drawn: Pick<IAutoMovieDrawnVideoResult, "frames" | "diagnostics">,
  ) => Promise<void>;
}): Promise<IAutoMovieDrawnVideoResult> {
  const { subject } = props.session;
  const spec: IAutoMovieRenderSpec = {
    ...props.spec,
    frameFormat: {
      width: subject.width,
      height: subject.height,
      fps: subject.fps,
    },
  };
  const plan: ReturnType<typeof planAutoMovieVideoEncoding> =
    planAutoMovieVideoEncoding({
      spec,
      durationSeconds: subject.durationSeconds,
      frameDir: props.frameDir,
      outputPath: props.outputPath,
      audio: props.audio,
    });

  // Every frame of the clock, drawn and written in order.
  const frames: {
    index: number;
    seconds: number;
    file: string;
    hash: string;
  }[] = [];
  const packets: IAutoMovieInspectionDiagnostics[] = [];
  const times: number[] = frameTimes(subject.fps, subject.durationSeconds);
  for (const [index, seconds] of times.entries()) {
    const { picture, diagnostics }: IAutoMovieDrawnPass = (
      await props.session.frame(seconds, ["beauty"], "delivery")
    )[0]!;
    if (diagnostics !== undefined) {
      const { time } = diagnostics;
      if (
        time.filmSeconds !== seconds ||
        (time.outputFrame !== undefined && time.outputFrame !== index)
      )
        throw new Error(
          `Inspection diagnostics do not match output frame ${index} at ${seconds} s.`,
        );
      packets.push({ ...diagnostics, time: { ...time, outputFrame: index } });
    }
    const file: string = `${props.frameDir}/${frameName(index)}`;
    await props.write(file, await encodeAutoMovieRasterPng(picture));
    frames.push({
      index,
      seconds,
      file,
      hash: hashAutoMovieRasterImage(picture),
    });
  }

  const diagnostics: IAutoMovieInspectionDiagnostics.IAudit | undefined =
    packets.length === 0
      ? undefined
      : reduceAutoMovieInspectionEpisodes(packets, times.length);
  const drawn: Pick<IAutoMovieDrawnVideoResult, "frames" | "diagnostics"> = {
    frames,
    ...(diagnostics === undefined ? {} : { diagnostics }),
  };
  await props.encode(plan.args, drawn);
  return { ...drawn, args: plan.args, frameRate: plan.frameRate };
}
