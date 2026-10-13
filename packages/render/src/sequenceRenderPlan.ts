import {
  IAutoMoviePlaybackTimeline,
  playbackCursor,
  sequenceTimeline,
} from "@automovie/engine";
import {
  IAutoMovieRenderSpec,
  IAutoMovieSequence,
  IAutoMovieShot,
  IAutoMovieTransition,
  IAutoMovieTrim,
} from "@automovie/interface";

import {
  ffmpegArgs,
  frameName,
  framePattern,
  frameTimes,
  renderPathStem,
} from "./plan";

/**
 * A shot entry resolved onto the sequence output clock.
 *
 * @author Samchon
 */
export interface IAutoMovieSequenceRenderShotSpan {
  /**
   * Index into `sequence.shots`.
   *
   * @author Samchon
   */
  entry: number;

  /**
   * Shot id played by this entry.
   *
   * @author Samchon
   */
  shot: string;

  /**
   * Global output second where the entry starts.
   *
   * @author Samchon
   */
  start: number;

  /**
   * Global output second where the entry ends.
   *
   * @author Samchon
   */
  end: number;

  /**
   * Seconds of the source shot that this entry plays.
   *
   * @author Samchon
   */
  played: number;

  /**
   * Source shot-local second where playback begins.
   *
   * @author Samchon
   */
  offset: number;

  /**
   * Trim copied from the sequence entry.
   *
   * @author Samchon
   */
  trim: IAutoMovieTrim | null;
}

/**
 * Incoming transition span on the output clock.
 *
 * @author Samchon
 */
export interface IAutoMovieSequenceRenderTransitionSpan {
  /**
   * Index of the incoming entry in `sequence.shots`.
   *
   * @author Samchon
   */
  entry: number;

  /**
   * Outgoing shot id.
   *
   * @author Samchon
   */
  from: string;

  /**
   * Incoming shot id.
   *
   * @author Samchon
   */
  to: string;

  /**
   * Transition style copied from the sequence entry.
   *
   * @author Samchon
   */
  kind: IAutoMovieTransition["kind"];

  /**
   * Global output second where the transition begins.
   *
   * @author Samchon
   */
  start: number;

  /**
   * Global output second where the transition ends.
   *
   * @author Samchon
   */
  end: number;

  /**
   * Transition overlap duration in seconds.
   *
   * @author Samchon
   */
  duration: number;
}

/**
 * A sequence frame sample ready for a render host.
 *
 * @author Samchon
 */
export interface IAutoMovieSequenceRenderFrame {
  /**
   * Zero-based output frame index.
   *
   * @author Samchon
   */
  index: number;

  /**
   * Global output sample time in seconds.
   *
   * @author Samchon
   */
  timeSeconds: number;

  /**
   * Frame path that the capture host should write.
   *
   * @author Samchon
   */
  path: string;

  /**
   * Live shot id at this output frame.
   *
   * @author Samchon
   */
  shot: string;

  /**
   * Live shot-local time in seconds.
   *
   * @author Samchon
   */
  shotTimeSeconds: number;

  /**
   * Outgoing tail blended into this frame, or `null` for a hard cut.
   *
   * @author Samchon
   */
  blend: {
    /** Outgoing shot id. */
    shot: string;

    /** Outgoing shot-local time in seconds. */
    shotTimeSeconds: number;

    /** Incoming weight in `[0, 1)`. */
    alpha: number;
  } | null;
}

/**
 * Public sequence render manifest: editorial timeline, transition spans, frame
 * samples, output paths, and encoder args in one deterministic artifact.
 *
 * @author Samchon
 */
export interface IAutoMovieSequenceRenderPlan {
  /**
   * Render target identity.
   *
   * @author Samchon
   */
  target: { kind: "sequence"; id: string };

  /**
   * Sequence fps as authored by the cut.
   *
   * @author Samchon
   */
  sequenceFps: number;

  /**
   * Output fps from the render spec.
   *
   * @author Samchon
   */
  renderFps: number;

  /**
   * Total output seconds after transition overlaps are subtracted.
   *
   * @author Samchon
   */
  durationSeconds: number;

  /**
   * Number of output frames.
   *
   * @author Samchon
   */
  frameCount: number;

  /**
   * Global output sample times, one per frame.
   *
   * @author Samchon
   */
  times: number[];

  /**
   * Shot spans on the output clock.
   *
   * @author Samchon
   */
  shots: IAutoMovieSequenceRenderShotSpan[];

  /**
   * Incoming transition spans on the output clock.
   *
   * @author Samchon
   */
  transitionSpans: IAutoMovieSequenceRenderTransitionSpan[];

  /**
   * Frame samples in capture order.
   *
   * @author Samchon
   */
  frames: IAutoMovieSequenceRenderFrame[];

  /**
   * Directory where frame files should be written.
   *
   * @author Samchon
   */
  frameDir: string;

  /**
   * First output frame path.
   *
   * @author Samchon
   */
  firstFrame: string;

  /**
   * Last output frame path.
   *
   * @author Samchon
   */
  lastFrame: string;

  /**
   * Ffmpeg input pattern for the frame sequence.
   *
   * @author Samchon
   */
  inputPattern: string;

  /**
   * Encoded video output path.
   *
   * @author Samchon
   */
  outputPath: string;

  /**
   * Exact ffmpeg argument vector for the encoded output.
   *
   * @author Samchon
   */
  ffmpegArgs: string[];
}

/**
 * Build the render-layer manifest for a committed sequence. The output FPS is
 * controlled by the render spec; the cut's fps is preserved as editorial
 * metadata. Trim and transition arithmetic is delegated to the engine playback
 * timeline, then copied into the manifest so the capture host has no hidden
 * timing rules.
 *
 * @author Samchon
 */
export const planSequenceRender = (props: {
  /** Sequence being rendered. */
  sequence: IAutoMovieSequence;

  /** Committed shots referenced by the sequence. */
  shots: IAutoMovieShot[];

  /** Render parameters whose `target` must equal `sequence.id`. */
  spec: IAutoMovieRenderSpec;

  /** Optional frame directory override. */
  frameDir?: string;

  /** Optional encoded output path override. */
  outputPath?: string;
}): IAutoMovieSequenceRenderPlan => {
  if (props.spec.target !== props.sequence.id)
    throw new Error(
      `render spec target "${props.spec.target}" must equal sequence "${props.sequence.id}"`,
    );

  const timeline = sequenceTimeline(props.sequence, props.shots);
  const times = frameTimes(props.spec.frameFormat.fps, timeline.runtime);
  if (times.length === 0)
    throw new Error(
      `planSequenceRender requires at least one frame; fps ${props.spec.frameFormat.fps} and duration ${timeline.runtime} produced zero frames`,
    );

  const stem = renderPathStem(props.sequence.id);
  const frameDir = props.frameDir ?? `frames/${stem}`;
  const outputPath = props.outputPath ?? `${stem}.mp4`;
  const inputPattern = `${frameDir}/${framePattern()}`;
  return {
    target: { kind: "sequence", id: props.sequence.id },
    sequenceFps: props.sequence.fps,
    renderFps: props.spec.frameFormat.fps,
    durationSeconds: timeline.runtime,
    frameCount: times.length,
    times,
    shots: timeline.entries.map((entry) => ({
      entry: entry.entry,
      shot: entry.shot,
      start: entry.start,
      end: entry.start + entry.played,
      played: entry.played,
      offset: entry.offset,
      trim: props.sequence.shots[entry.entry]!.trim,
    })),
    transitionSpans: transitionSpans(props.sequence, timeline),
    frames: frameSamples(props.sequence, timeline, times, frameDir),
    frameDir,
    firstFrame: `${frameDir}/${frameName(0)}`,
    lastFrame: `${frameDir}/${frameName(times.length - 1)}`,
    inputPattern,
    outputPath,
    ffmpegArgs: ffmpegArgs(props.spec, inputPattern, outputPath),
  };
};

const transitionSpans = (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
): IAutoMovieSequenceRenderTransitionSpan[] =>
  timeline.entries.flatMap((entry) => {
    const transition = sequence.shots[entry.entry]!.transition;
    if (transition === null) return [];
    const outgoing = timeline.entries[entry.entry - 1]!;
    return [
      {
        entry: entry.entry,
        from: outgoing.shot,
        to: entry.shot,
        kind: transition.kind,
        start: entry.start,
        end: entry.start + transition.duration,
        duration: transition.duration,
      },
    ];
  });

/**
 * Resolve every output frame in one forward sweep. Frame times come from
 * {@link frameTimes} (`i / fps`, strictly increasing), so a single
 * {@link playbackCursor} walks the timeline once, O(frames + entries) instead of
 * a per-frame scan, landing on the same live entry a per-frame resolve would,
 * so the samples are byte-identical.
 */
const frameSamples = (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
  times: number[],
  frameDir: string,
): IAutoMovieSequenceRenderFrame[] => {
  const cursor = playbackCursor(sequence, timeline);
  return times.map((time, index): IAutoMovieSequenceRenderFrame => {
    const sample = cursor(time);
    return {
      index,
      timeSeconds: time,
      path: `${frameDir}/${frameName(index)}`,
      shot: sample.shot,
      shotTimeSeconds: sample.time,
      blend:
        sample.blend === null
          ? null
          : {
              shot: sample.blend.shot,
              shotTimeSeconds: sample.blend.time,
              alpha: sample.blend.alpha,
            },
    };
  });
};
