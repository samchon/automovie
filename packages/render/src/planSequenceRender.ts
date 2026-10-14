import { IAutoMoviePlaybackTimeline, playbackCursor, sequenceTimeline } from "@automovie/engine";
import { IAutoMovieRenderSpec, IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import { ffmpegArgs } from "./ffmpegArgs";
import { frameName } from "./frameName";
import { framePattern } from "./framePattern";
import { frameTimes } from "./frameTimes";
import { renderPathStem } from "./renderPathStem";
import type { IAutoMovieSequenceRenderTransitionSpan } from "./IAutoMovieSequenceRenderTransitionSpan";
import type { IAutoMovieSequenceRenderFrame } from "./IAutoMovieSequenceRenderFrame";
import type { IAutoMovieSequenceRenderPlan } from "./IAutoMovieSequenceRenderPlan";




/**
 * Build the render-layer manifest for a committed sequence. The output FPS is controlled by the render spec; the cut's fps is preserved as editorial metadata. Trim and transition arithmetic is delegated to the engine playback timeline, then copied into the manifest so the capture host has no hidden timing rules.
 *
 * @evidence contracts/common.md#principled-implementation sequenceTimeline owns trim and overlap arithmetic, frameTimes supplies increasing half-open output samples, and one playbackCursor resolves those samples without changing the sequence's editorial fps.
 * @evidence contracts/common.md#clear-and-simple-design The manifest gathers timeline spans, resolved frame samples and paths so a capture host reads one plan instead of independently implementing the cut.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A mismatched render target or empty schedule refuses; output path overrides are caller data and no sequence identity is specially recognized.
 * @evidence contracts/common.md#meaningful-documentation The planner documents editorial versus output fps and target equality; manifest members state seconds, trim offsets, blend weights and host paths.
 * @evidence contracts/performance.md#efficient-algorithms For S supplied shots, E timeline entries and F output frames, the engine first indexes all S shots, including unused extras; layout and the forward cursor then cost O(E+F), for O(S+E+F) planning time and peak metadata space. The returned manifest retains O(E+F) records and no per-frame full timeline scan occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work One resolved timeline feeds shot spans, transitions and every frame sample; the forward cursor retains its current entry across increasing sample times only within this call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned plan retains shot-span and frame metadata proportional to the output schedule; the temporary cursor and timeline are released on return, and planning opens no host resource.
 */
export const planSequenceRender: (props: {
    sequence: IAutoMovieSequence;
    shots: IAutoMovieShot[];
    spec: IAutoMovieRenderSpec;
    frameDir?: string;
    outputPath?: string;
}) => IAutoMovieSequenceRenderPlan = (props: {
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

  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(props.sequence, props.shots);
  const times: number[] = frameTimes(props.spec.frameFormat.fps, timeline.runtime);
  if (times.length === 0)
    throw new Error(
      `planSequenceRender requires at least one frame; fps ${props.spec.frameFormat.fps} and duration ${timeline.runtime} produced zero frames`,
    );

  const stem: string = renderPathStem(props.sequence.id);
  const frameDir: string = props.frameDir ?? `frames/${stem}`;
  const outputPath: string = props.outputPath ?? `${stem}.mp4`;
  const inputPattern: string = `${frameDir}/${framePattern()}`;
  return {
    target: { kind: "sequence", id: props.sequence.id },
    sequenceFps: props.sequence.fps,
    renderFps: props.spec.frameFormat.fps,
    durationSeconds: timeline.runtime,
    frameCount: times.length,
    times,
    shots: timeline.entries.map((entry: IAutoMoviePlaybackTimeline["entries"][number]): IAutoMovieSequenceRenderPlan["shots"][number] => ({
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



const transitionSpans: (sequence: IAutoMovieSequence, timeline: IAutoMoviePlaybackTimeline) => IAutoMovieSequenceRenderTransitionSpan[] = (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
): IAutoMovieSequenceRenderTransitionSpan[] =>
  timeline.entries.flatMap((entry: IAutoMoviePlaybackTimeline["entries"][number]): IAutoMovieSequenceRenderTransitionSpan[] => {
    const transition: IAutoMovieSequence["shots"][number]["transition"] = sequence.shots[entry.entry]!.transition;
    if (transition === null) return [];
    const outgoing: IAutoMoviePlaybackTimeline["entries"][number] = timeline.entries[entry.entry - 1]!;
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
 * Resolve every output frame in one forward sweep. Frame times come from {@link frameTimes} (`i / fps`, strictly increasing), so a single {@link playbackCursor} walks the timeline once, O(frames + entries) instead of a per-frame scan, landing on the same live entry a per-frame resolve would, so the samples are byte-identical.
 */
const frameSamples: (sequence: IAutoMovieSequence, timeline: IAutoMoviePlaybackTimeline, times: number[], frameDir: string) => IAutoMovieSequenceRenderFrame[] = (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
  times: number[],
  frameDir: string,
): IAutoMovieSequenceRenderFrame[] => {
  const cursor: ReturnType<typeof playbackCursor> = playbackCursor(sequence, timeline);
  return times.map((time: number, index: number): IAutoMovieSequenceRenderFrame => {
    const sample: ReturnType<typeof cursor> = cursor(time);
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
