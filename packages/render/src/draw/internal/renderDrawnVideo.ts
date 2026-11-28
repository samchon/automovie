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

import { AutoMovieRenderAudio } from "../../audio/AutoMovieRenderAudio";
import { AutoMovieControlChannelWriter } from "../../delivery/controlChannel/AutoMovieControlChannelWriter";
import { AutoMovieRenderDraw } from "../AutoMovieRenderDraw";
import { planAlphaWrap } from "../../delivery/internal/planAlphaWrap";
import { planDeliveredCut } from "../../delivery/internal/planDeliveredCut";
import { planVideoEncoding } from "../../delivery/internal/planVideoEncoding";
import { frameName } from "../../frameName";
import { frameTimes } from "../../internal/frameTimes";
import { AutoMovieRenderPicture } from "../../picture/AutoMovieRenderPicture";
import { reduceInspectionEpisodes } from "../../scene/inspection/internal/reduceInspectionEpisodes";
import type { IAutoMovieRenderDrawnVideoProps } from "../IAutoMovieRenderDrawnVideoProps";
import { observeDrawActivity } from "./observeDrawActivity";

/*
 * Render a drawn subject into one video: draw every frame of its clock through
 * the draw page's function, write each as a PNG, then encode them once.
 *
 * The clock and raster are the subject's, read from the session, so the spec
 * takes no frame format. The encoding is admitted and planned by
 * `planVideoEncoding` before the first frame is drawn, so a clock that
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
 * with the output frames it is live in, from `planDeliveredCut` over
 * the same instants the frames are drawn at, mapped before the first frame.
 *
 * With `controls`, each frame is drawn in `beauty` and every control pass in
 * one `frame` call, so all passes share the frame's seek and camera; the
 * control pictures are written as `<controls.frameDir>/frame_<i>.<pass>.png` by
 * `AutoMovieControlChannelWriter` and are never encoded, because a viewing
 * encode changes depth values and mask colours. The result's `controls` lists
 * each channel's convention and file digests. The passes are admitted by
 * `AutoMovieRenderDraw.admitControlPasses` before any frame is drawn.
 *
 * With `background` `transparent`, each frame is drawn over a transparent
 * background and written as a straight-alpha RGBA PNG, and `encode` is handed
 * `AutoMovieRenderVideo.planAlphaWrap`'s vector, which wraps the files unencoded with no
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
export async function renderDrawnVideo(props: IAutoMovieRenderDrawnVideoProps): Promise<IAutoMovieDrawnVideoResult> {
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
  const plan: ReturnType<typeof planVideoEncoding> =
    planVideoEncoding({
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
      : planDeliveredCut({ timeline: subject.cut, times });

  // Control channels are admitted before any frame is drawn.
  const passes: Exclude<AutoMovieGuidePass, "beauty">[] =
    AutoMovieRenderDraw.admitControlPasses(props.controls?.passes ?? []);
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
  try {
    for (const [index, seconds] of times.entries()) {
      const clock = { frame: index, seconds, frameCount: times.length };
      // One frame request ties every pass to the same seek and camera.
      const pictures: IAutoMovieDrawnPass[] = await observeDrawActivity(
        props.observe,
        { ...clock, stage: "draw-frame" },
        () =>
          props.session.frame(
            seconds,
            ["beauty", ...passes],
            "delivery",
            transparent ? "transparent" : undefined,
          ),
      );
      const { picture, diagnostics }: IAutoMovieDrawnPass = pictures[0]!;
      mouths.push(pictures[0]!.mouths);
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
      await observeDrawActivity(
        props.observe,
        { ...clock, stage: "write-frame" },
        async (): Promise<void> => {
          await channels?.add(index, seconds, pictures.slice(1));
          await props.write(
            file,
            await AutoMovieRenderPicture.encodeRasterPng(picture, {
              alpha: transparent,
            }),
          );
        },
      );
      const receipt: IAutoMovieDrawnVideoResult["frames"][number] = {
        index,
        seconds,
        file,
        hash: AutoMovieRenderPicture.hashRasterImage(picture),
      };
      frames.push(receipt);
      props.frameWritten?.(receipt);
    }
  } catch (cause) {
    if (props.incompleteAudit !== undefined && packets.length !== 0) {
      try {
        props.incompleteAudit(reduceInspectionEpisodes(packets, times.length));
      } catch (auditFailure) {
        throw new AggregateError(
          [cause, auditFailure],
          cause instanceof Error ? cause.message : String(cause),
        );
      }
    }
    throw cause;
  }

  const diagnostics: IAutoMovieInspectionDiagnostics.IAudit | undefined =
    packets.length === 0
      ? undefined
      : reduceInspectionEpisodes(packets, times.length);

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
    ? planAlphaWrap({
        frameDir: props.frameDir,
        outputPath: props.outputPath,
        frameRate: {
          numerator: plan.frameRate[0],
          denominator: plan.frameRate[1],
        },
        frameCount: plan.frameCount,
      })
    : plan.args;
  await props.encode(args, drawn);
  return { ...drawn, args, frameRate: plan.frameRate };
}

/*
 * The admitted lines and the mouth track handed to the subject.
 */
interface ISpeech {
  /*
   * The adopted lines, admitted on the film clock.
   */
  lines: IAutoMovieMixFilmSound.ILine[];

  /*
   * The mouth track handed to the subject.
   */
  track: IAutoMovieDialogueMouthTrack;
}
