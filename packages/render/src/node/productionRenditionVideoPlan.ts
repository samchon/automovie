import {
  equalProductionFrameRates,
  resolveProductionFrameRate,
} from "@automovie/engine";
import type {
  IAutoMovieFilmTimelineSegment,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import type { IProductionRenditionClip } from "./IProductionRenditionClip";
import { parseProductionRenditionClip } from "./parseProductionRenditionClip";
import { sameSampleDescription } from "./sameSampleDescription";
import { sampleDescription } from "./sampleDescription";

/**
 * Resolve a film timeline's repaint clips into an ordered, continuous splice
 * plan.
 *
 * `clips` maps each segment's `shot` to that shot's current clip bytes. Every
 * segment must be cut in and cut out, have a clip, and play that clip whole:
 * source frames `0` to the clip's frame count, a timeline span of the same
 * length, and the timeline's frame rate. The segments must start at frame 0,
 * follow each other without gap or overlap, and end at `totalFrames`, and
 * every clip must share the first clip's raster and decoder configuration.
 * The plan returns the parsed clips in timeline order with their segments,
 * the first clip, its sample entry, its sample duration in media ticks, and
 * the media duration `totalFrames * sampleDuration`.
 *
 * Throws, naming the shot where one is at fault, for a transition, a missing
 * clip, the clip parser's refusal, a partial or mismatched clip, an empty
 * timeline, a gap or overlap, a raster or configuration change, a timeline
 * not covered to its end, and a media duration beyond the safe-integer range.
 *
 * @evidence contracts/common.md#principled-implementation A lossless splice can only concatenate whole clips that decode under one configuration on one frame clock, so each condition is the precondition of copying samples without re-encoding; frame rates are compared as reduced rationals, and the media duration is checked as a safe integer because MP4 clocks are integer ticks.
 * @evidence contracts/common.md#clear-and-simple-design The rendition conform writer and the feature-uses-clips proof read this one plan, so the clips the writer joins and the clips the proof checks against cannot be resolved differently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transitions and partial trims are refused as unrepresentable rather than approximated, and no shot or rate is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states the clip mapping, every condition on segments and clips, each returned field with its unit, and the refusals.
 * @evidence contracts/performance.md#efficient-algorithms For N segments and S samples, each clip is parsed once by the clip parser, and one O(N) pass checks continuity and configuration, comparing each clip's first sample entry with the first clip's by serialized bytes, so the plan is linear in the total clip bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The writer and the proof each build the plan from the bytes they hold, because the proof must not trust a plan the writer produced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned plan holds every parsed clip record, and through them every clip's bytes and parse, until the caller drops it; nothing else is retained or opened.
 */
export const productionRenditionVideoPlan = (props: {
  /** Current film timeline whose segments the clips realize. */
  timeline: IAutoMovieFilmTimeline;

  /** Current clip bytes keyed by segment `shot`. */
  clips: ReadonlyMap<string, Uint8Array>;
}): {
  /** Parsed clips in timeline order, each with its segment. */
  parsed: Array<IProductionRenditionClip & { segment: IAutoMovieFilmTimelineSegment }>;

  /** The first clip, whose clock, raster and configuration the others share. */
  first: IProductionRenditionClip & { segment: IAutoMovieFilmTimelineSegment };

  /** The first clip's sample entry, shared by every clip. */
  description: ReturnType<typeof sampleDescription>;

  /** Duration of every sample, in media ticks of the first clip's timescale. */
  sampleDuration: number;

  /** `timeline.totalFrames * sampleDuration`, in the same ticks. */
  mediaDuration: number;
} => {
  const frameRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(
    props.timeline,
  );
  const parsed: Array<
    IProductionRenditionClip & { segment: IAutoMovieFilmTimelineSegment }
  > = props.timeline.segments.map(
    (
      segment: IAutoMovieFilmTimelineSegment,
    ): IProductionRenditionClip & { segment: IAutoMovieFilmTimelineSegment } => {
      if (
        segment.transitionIn.kind !== "cut" ||
        segment.transitionOut.kind !== "cut"
      )
        throw new Error(
          `Repainted feature delivery currently requires cut-only editing; shot "${segment.shot}" declares a transition.`,
        );
      const bytes: Uint8Array | undefined = props.clips.get(segment.shot);
      if (bytes === undefined)
        throw new Error(
          `Repainted feature delivery is missing the current clip for shot "${segment.shot}".`,
        );
      const clip: IProductionRenditionClip = parseProductionRenditionClip(
        bytes,
        `Repaint clip "${segment.shot}"`,
      );
      if (
        segment.sourceInFrame !== 0 ||
        segment.sourceOutFrame !== clip.probe.frameCount ||
        segment.endFrame - segment.startFrame !== clip.probe.frameCount ||
        equalProductionFrameRates(clip.probe.frameRate, frameRate) === false
      )
        throw new Error(
          `Repainted feature delivery requires one full-shot ${props.timeline.fps}fps clip for segment "${segment.shot}"; partial trims and mismatched media are not representable yet.`,
        );
      return { segment, ...clip };
    },
  );
  const first:
    | (IProductionRenditionClip & { segment: IAutoMovieFilmTimelineSegment })
    | undefined = parsed[0];
  if (first === undefined)
    throw new Error(
      "Repainted feature delivery requires a non-empty timeline.",
    );
  const description: ReturnType<typeof sampleDescription> = sampleDescription(
    first.samples[0]!,
  );
  let nextFrame: number = 0;
  for (const clip of parsed) {
    if (clip.segment.startFrame !== nextFrame)
      throw new Error(
        `Repaint clip "${clip.segment.shot}" does not begin at the next continuous film frame.`,
      );
    if (
      clip.probe.width !== first.probe.width ||
      clip.probe.height !== first.probe.height ||
      sameSampleDescription(
        description,
        sampleDescription(clip.samples[0]!),
      ) === false
    )
      throw new Error(
        `Repaint clip "${clip.segment.shot}" changes dimensions or H.264 decoder configuration within the feature.`,
      );
    nextFrame = clip.segment.endFrame;
  }
  if (nextFrame !== props.timeline.totalFrames)
    throw new Error(
      "Repaint clips do not cover one continuous current film timeline.",
    );
  const sampleDuration: number = first.sampleDuration;
  const mediaDuration: number = props.timeline.totalFrames * sampleDuration;
  if (Number.isSafeInteger(mediaDuration) === false)
    throw new Error(
      "Repainted feature duration exceeds the exact MP4 clock range.",
    );
  return { parsed, first, description, sampleDuration, mediaDuration };
};
