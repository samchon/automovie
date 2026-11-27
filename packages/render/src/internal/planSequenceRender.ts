import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMoviePlanSequenceRenderProps,
  IAutoMoviePlaybackEditorialMarker,
  IAutoMoviePlaybackTimeline,
  IAutoMoviePreparePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieSequenceRenderFrame,
  IAutoMovieSequenceRenderPlan,
  IAutoMovieSequenceRenderTransitionSpan,
} from "@automovie/interface";

import { ffmpegArgs } from "./ffmpegArgs";
import { frameName } from "../frameName";
import { framePattern } from "../framePattern";
import { frameTimes } from "./frameTimes";
import { renderPathStem } from "../renderPathStem";

/*
 * Build the render-layer manifest for a committed sequence. The output FPS is
 * controlled by the render spec; the cut's fps is preserved as editorial
 * metadata. Trim, playback-rate and transition arithmetic is delegated to the
 * engine playback timeline, then copied into the manifest so the capture host
 * has no hidden timing rules.
 */
export const planSequenceRender: (
  props: IAutoMoviePlanSequenceRenderProps,
) => IAutoMovieSequenceRenderPlan = (
  props: IAutoMoviePlanSequenceRenderProps,
): IAutoMovieSequenceRenderPlan => {
  if (props.spec.target !== props.sequence.id)
    throw new Error(
      `render spec target "${props.spec.target}" must equal sequence "${props.sequence.id}"`,
    );

  const playback: IAutoMoviePreparePlaybackTimeline.IResult =
    AutoMovieEngineFilm.preparePlaybackTimeline(props.sequence, props.shots);
  const timeline: IAutoMoviePlaybackTimeline = playback.timeline;
  const times: number[] = frameTimes(
    props.spec.frameFormat.fps,
    timeline.runtime,
  );
  if (times.length === 0)
    throw new Error(
      `planSequenceRender requires at least one frame; fps ${props.spec.frameFormat.fps} and duration ${timeline.runtime} produced zero frames`,
    );

  const stem: string = renderPathStem(props.sequence.id);
  const frameDir: string = props.frameDir ?? `frames/${stem}`;
  const outputPath: string = props.outputPath ?? `${stem}.mp4`;
  const inputPattern: string = `${frameDir}/${framePattern()}`;
  const editorialMarkers: IAutoMoviePlaybackEditorialMarker[] =
    AutoMovieEngineFilm.sequenceEditorialMarkerTimeline(props.sequence, playback);
  return {
    target: { kind: "sequence", id: props.sequence.id },
    ...(editorialMarkers.length === 0 ? {} : { editorialMarkers }),
    sequenceFps: props.sequence.fps,
    renderFps: props.spec.frameFormat.fps,
    durationSeconds: timeline.runtime,
    frameCount: times.length,
    times,
    shots: timeline.entries.map(
      (
        entry: IAutoMoviePlaybackTimeline["entries"][number],
      ): IAutoMovieSequenceRenderPlan["shots"][number] => ({
        entry: entry.entry,
        shot: entry.shot,
        start: entry.start,
        end: entry.start + entry.played,
        played: entry.played,
        offset: entry.offset,
        trim: props.sequence.shots[entry.entry]!.trim,
        ...(entry.playbackRate === undefined
          ? {}
          : { playbackRate: entry.playbackRate }),
      }),
    ),
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

const transitionSpans: (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
) => IAutoMovieSequenceRenderTransitionSpan[] = (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
): IAutoMovieSequenceRenderTransitionSpan[] =>
  timeline.entries.flatMap(
    (
      entry: IAutoMoviePlaybackTimeline["entries"][number],
    ): IAutoMovieSequenceRenderTransitionSpan[] => {
      const transition: IAutoMovieSequence["shots"][number]["transition"] =
        sequence.shots[entry.entry]!.transition;
      if (transition === null) return [];
      const outgoing: IAutoMoviePlaybackTimeline["entries"][number] =
        timeline.entries[entry.entry - 1]!;
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
    },
  );

/*
 * Resolve every output frame in one forward sweep. Frame times come from
 * frameTimes (`i / fps`, strictly increasing), so a single
 * playbackCursor walks the timeline once, O(frames + entries) instead of
 * a per-frame scan, landing on the same live entry a per-frame resolve would,
 * so the samples are byte-identical.
 */
const frameSamples: (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
  times: number[],
  frameDir: string,
) => IAutoMovieSequenceRenderFrame[] = (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
  times: number[],
  frameDir: string,
): IAutoMovieSequenceRenderFrame[] => {
  const cursor: ReturnType<typeof AutoMovieEngineFilm.playbackCursor> = AutoMovieEngineFilm.playbackCursor(
    sequence,
    timeline,
  );
  return times.map(
    (time: number, index: number): IAutoMovieSequenceRenderFrame => {
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
                kind: sample.blend.kind,
              },
      };
    },
  );
};
