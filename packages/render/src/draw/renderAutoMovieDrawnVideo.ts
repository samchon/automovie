import type {
  AutoMovieGuidePass,
  IAutoMovieDeliveredCutEntry,
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawnMouth,
  IAutoMovieDrawnPass,
  IAutoMovieDrawnVideoResult,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieMixFilmSound,
  IAutoMovieRenderSpec,
} from "@automovie/interface";

import { AutoMovieRenderAudio } from "../audio/AutoMovieRenderAudio.js";
import { AutoMovieControlChannelWriter } from "../delivery/AutoMovieControlChannelWriter.js";
import { admitAutoMovieControlPasses } from "../delivery/admitAutoMovieControlPasses.js";
import { planAutoMovieAlphaWrap } from "../delivery/planAutoMovieAlphaWrap.js";
import { planAutoMovieDeliveredCut } from "../delivery/planAutoMovieDeliveredCut.js";
import { planAutoMovieVideoEncoding } from "../delivery/planAutoMovieVideoEncoding.js";
import { frameName } from "../frameName.js";
import { frameTimes } from "../internal/frameTimes.js";
import { AutoMovieRenderPicture } from "../picture/AutoMovieRenderPicture.js";
import { reduceAutoMovieInspectionEpisodes } from "../scene/inspection/internal/reduceAutoMovieInspectionEpisodes.js";
import type { AutoMovieDrawSession } from "./AutoMovieDrawSession.js";

/** The admitted lines and the mouth track handed to the subject. */
interface ISpeech {
  /** The adopted lines, admitted on the film clock. */
  lines: IAutoMovieMixFilmSound.ILine[];

  /** The mouth track handed to the subject. */
  track: IAutoMovieDialogueMouthTrack;
}

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
 * A subject that declares a sound list gets its soundtrack from it: before the
 * first frame, `AutoMovieRenderAudio.mixFilmSound` reads the list's files
 * through `read`, admits and mixes them to the subject's `delivery.loudness`
 * targets (EBU R 128 without them), and the WAVE master is written as
 * `<frameDir>/soundtrack.wav` and encoded as the film's soundtrack; the
 * result's `sound` carries its digest, each line's PCM digest, the master's
 * analysis and the loudness record. A subject that declares a sound list and a
 * soundtrack `audio` is refused.
 *
 * The same lines then give the subject its dialogue mouths: before the first
 * frame, `AutoMovieRenderAudio.planDialogueMouths` plans the track; the
 * session's `speak` hands it to the page, also for a transparent layer, whose
 * lines are admitted by `AutoMovieRenderAudio.admitDialogue` without a mix.
 * Each frame's beauty pass carries the mouths the subject read for that frame,
 * and the sound record's `lipSync` measures each line against them
 * (`AutoMovieRenderAudio.measureDialogueLipSync`), so the lag is the lag of the mouth
 * actually handed to the drawing.
 *
 * A subject that supplies a `cut` gets the result's `cut`: one row per entry
 * with the output frames it is live in, from `planAutoMovieDeliveredCut` over
 * the same instants the frames are drawn at, mapped before the first frame.
 *
 * With `controls`, each frame is drawn in `beauty` and every control pass in
 * one `frame` call, so all passes share the frame's seek and camera; the
 * control pictures are written as `<controls.frameDir>/frame_<i>.<pass>.png` by
 * `AutoMovieControlChannelWriter` and are never encoded, because a viewing
 * encode changes depth values and mask colours. The result's `controls` lists
 * each channel's convention and file digests. The passes are admitted by
 * `admitAutoMovieControlPasses` before any frame is drawn.
 *
 * With `background` `transparent`, each frame is drawn over a transparent
 * background and written as a straight-alpha RGBA PNG, and `encode` is handed
 * `planAutoMovieAlphaWrap`'s vector, which wraps the files unencoded with no
 * audio; the subject's soundtrack and sound list are left to its film, and
 * control passes are refused, because guide passes keep their black
 * background.
 *
 * Files and processes are the host's: `write` stores a file, `read` reads a
 * sound-list file and `encode` runs FFmpeg, so the order of every step runs
 * under a unit test. `encode` is handed the frame receipts and scene audit with
 * its arguments, so they survive an encoder failure. A draw, write or encode
 * failure rejects at once and leaves the files written so far to the host.
 */
export async function renderAutoMovieDrawnVideo(props: {
  /** The opened draw session of the subject. */
  session: Pick<AutoMovieDrawSession, "subject" | "frame" | "speak">;

  /** Encoding controls; the frame format is the subject's clock and raster. */
  spec: Omit<IAutoMovieRenderSpec, "frameFormat">;

  /** Folder the frame files are written into. */
  frameDir: string;

  /** The video file the encoder writes. */
  outputPath: string;

  /**
   * A complete soundtrack to mux, or null for none; it must be null when the
   * subject declares a sound list.
   */
  audio: string | null;

  /** Store one file whole. */
  write: (path: string, data: Uint8Array) => Promise<void>;

  /**
   * Read one file of the subject's sound list whole, by its production-relative
   * path.
   */
  read: (path: string) => Promise<Uint8Array>;

  /**
   * Run FFmpeg with the arguments, resolving once it succeeded. It also
   * receives the drawn frames and scene audit, already complete, so a host can
   * keep them when encoding fails.
   */
  encode: (
    args: readonly string[],
    drawn: Pick<
      IAutoMovieDrawnVideoResult,
      "frames" | "diagnostics" | "sound" | "cut" | "controls"
    >,
  ) => Promise<void>;

  /**
   * Control channels drawn beside the film: guide passes other than `beauty`,
   * each named once, written under `frameDir`; absent or empty draws the film
   * alone.
   */
  controls?: {
    /** The passes, in the order their files and record entries take. */
    passes: readonly string[];

    /** Folder the control frame files are written into. */
    frameDir: string;
  };

  /**
   * `transparent` draws every frame over a transparent background, writes
   * straight-alpha RGBA PNG files and wraps them unencoded into the output by
   * `planAutoMovieAlphaWrap`, with no soundtrack; absent or `scene` draws the
   * opaque film.
   */
  background?: "scene" | "transparent";
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
  if (subject.sound !== undefined && props.audio !== null)
    throw new Error(
      `Subject "${subject.name}" declares both a sound list and the soundtrack "${props.audio}"; a film's sound comes from one of them.`,
    );
  // A transparent layer carries no sound; the film it is composited into does.
  const transparent: boolean = props.background === "transparent";
  if (transparent && (props.controls?.passes.length ?? 0) !== 0)
    throw new Error(
      `Subject "${subject.name}" cannot draw control passes over a transparent background; guide passes keep their own black background`,
    );
  const soundtrack: string | null = transparent
    ? null
    : subject.sound === undefined
      ? props.audio
      : `${props.frameDir}/soundtrack.wav`;
  const plan: ReturnType<typeof planAutoMovieVideoEncoding> =
    planAutoMovieVideoEncoding({
      spec,
      durationSeconds: subject.durationSeconds,
      frameDir: props.frameDir,
      outputPath: props.outputPath,
      audio: soundtrack,
    });

  // The sound list is mixed before any frame is drawn, so a refused receipt
  // or a missing file costs no drawing. A transparent layer writes no
  // soundtrack, but its figures still speak, so its lines are admitted alone.
  const frameRate: IAutoMovieMixFilmSound.IProps["frameRate"] = {
    numerator: plan.frameRate[0],
    denominator: plan.frameRate[1],
  };
  let mixed: IAutoMovieMixFilmSound.IResult | undefined;
  let speech: ISpeech | undefined;
  if (subject.sound !== undefined) {
    if (soundtrack !== null) {
      mixed = await AutoMovieRenderAudio.mixFilmSound({
        sound: subject.sound,
        frameRate,
        totalFrames: plan.frameCount,
        read: props.read,
        ...(subject.delivery?.loudness === undefined
          ? {}
          : { loudness: subject.delivery.loudness }),
      });
      await props.write(soundtrack, mixed.wav);
    }
    const lines: IAutoMovieMixFilmSound.ILine[] =
      mixed?.lines ??
      (await AutoMovieRenderAudio.admitDialogue({
        sound: subject.sound,
        frameRate,
        totalFrames: plan.frameCount,
        read: props.read,
      }));
    const track: IAutoMovieDialogueMouthTrack =
      AutoMovieRenderAudio.planDialogueMouths({
        lines,
        speakers: subject.sound.speakers,
        frameRate,
      });
    await props.session.speak(track);
    speech = { lines, track };
  }

  // The cut is mapped onto the very instants the frames are drawn at, before
  // any is drawn, so a malformed cut costs no drawing.
  const times: number[] = frameTimes(subject.fps, subject.durationSeconds);
  const cut: IAutoMovieDeliveredCutEntry[] | undefined =
    subject.cut === undefined
      ? undefined
      : planAutoMovieDeliveredCut({ timeline: subject.cut, times });

  // Control channels are admitted before any frame is drawn.
  const passes: Exclude<AutoMovieGuidePass, "beauty">[] =
    admitAutoMovieControlPasses(props.controls?.passes ?? []);
  const channels: AutoMovieControlChannelWriter | undefined =
    props.controls === undefined || passes.length === 0
      ? undefined
      : new AutoMovieControlChannelWriter({
          passes,
          frameDir: props.controls.frameDir,
          write: props.write,
        });

  // Every frame of the clock, drawn and written in order.
  const frames: {
    index: number;
    seconds: number;
    file: string;
    hash: string;
  }[] = [];
  const packets: IAutoMovieInspectionDiagnostics[] = [];
  const mouths: (IAutoMovieDrawnMouth[] | undefined)[] = [];
  for (const [index, seconds] of times.entries()) {
    // The film and its control channels in one call, so every pass shares
    // the frame's seek and camera.
    const pictures: IAutoMovieDrawnPass[] = await props.session.frame(
      seconds,
      ["beauty", ...passes],
      "delivery",
      transparent ? "transparent" : undefined,
    );
    const { picture, diagnostics }: IAutoMovieDrawnPass = pictures[0]!;
    mouths.push(pictures[0]!.mouths);
    await channels?.add(index, seconds, pictures.slice(1));
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
    await props.write(
      file,
      await AutoMovieRenderPicture.encodeRasterPng(picture, {
        alpha: transparent,
      }),
    );
    frames.push({
      index,
      seconds,
      file,
      hash: AutoMovieRenderPicture.hashRasterImage(picture),
    });
  }

  const diagnostics: IAutoMovieInspectionDiagnostics.IAudit | undefined =
    packets.length === 0
      ? undefined
      : reduceAutoMovieInspectionEpisodes(packets, times.length);

  // The soundtrack's record, with each line's lip sync measured against the
  // mouths the subject read on the drawn frames.
  const sound: IAutoMovieDrawnVideoResult["sound"] =
    mixed === undefined || speech === undefined || soundtrack === null
      ? undefined
      : {
          file: soundtrack,
          sha256: mixed.sha256,
          receipts: mixed.lines.map(
            (
              line: IAutoMovieMixFilmSound.ILine,
            ): { line: string; pcmDigest: string } => ({
              line: line.line.id,
              pcmDigest: line.receipt.pcmDigest,
            }),
          ),
          analysis: mixed.analysis,
          loudness: mixed.loudness,
          lipSync: AutoMovieRenderAudio.measureDialogueLipSync({
            lines: speech.lines,
            track: speech.track,
            plan: mixed.plan,
            drawn: mouths,
          }),
        };
  const drawn: Pick<
    IAutoMovieDrawnVideoResult,
    "frames" | "diagnostics" | "sound" | "cut" | "controls"
  > = {
    frames,
    ...(diagnostics === undefined ? {} : { diagnostics }),
    ...(sound === undefined ? {} : { sound }),
    ...(cut === undefined ? {} : { cut }),
    ...(channels === undefined ? {} : { controls: channels.finish() }),
  };
  // A transparent render wraps its PNG files as they are; the opaque film is
  // encoded on the planned vector.
  const args: string[] = transparent
    ? planAutoMovieAlphaWrap({
        frameDir: props.frameDir,
        outputPath: props.outputPath,
        frameRate: plan.frameRate,
        frameCount: plan.frameCount,
      })
    : plan.args;
  await props.encode(args, drawn);
  return { ...drawn, args, frameRate: plan.frameRate };
}
