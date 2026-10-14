import {
  IAutoMovieCompiledEffect,
  IAutoMovieFilmTimelineSegment,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../film/productionFrameBoundaryToSeconds";
import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";
import { IAutoMovieFilmEffectClock } from "./IAutoMovieFilmEffectClock";
import { IAutoMovieShotEffectFilmInterval } from "./IAutoMovieShotEffectFilmInterval";
import { estimateProductionFilmFrame } from "./estimateProductionFilmFrame";
import { productionFilmEffectTimelineFrameRate } from "./productionFilmEffectTimelineFrameRate";

type ShotEffect = Pick<
  IAutoMovieCompiledEffect,
  "id" | "zone" | "start" | "end"
>;

/** One shot effect with the half-open source-frame interval it owns. */
interface ISourceInterval {
  effect: ShotEffect;
  startFrame: number;
  endFrame: number;
}

/**
 * Project every shot-owned effect occurrence onto the film's half-open frame
 * clock.
 *
 * A shot cue owns the source frames whose exact boundary time satisfies
 * `start <= time < end`, the same comparison the engine sampler performs, so
 * the projection is decided by the rational frame boundary rather than by a
 * rounded `seconds * fps` product. Each film occurrence of the shot is trimmed
 * to its segment and dropped when nothing remains, and a shot the compiled set
 * does not contain contributes no interval because the builder's
 * shot-availability diagnostics own that refusal. Intervals come out in segment
 * order, then in the shot's effect order. A cue with a negative or non-finite
 * start, an end not after its start, or an unrepresentable bound throws
 * `AutoMovieFilmEffectRuntimeError` with `film-effect-input-invalid`, as does an
 * inconsistent clock.
 *
 * @evidence contracts/common.md#principled-implementation Each bound maps to the first frame whose exact `productionFrameBoundaryToSeconds` value is at or after it, so the owned source frames are exactly those with `start <= boundary < end`; the segment trim is an interval intersection with `[sourceInFrame, sourceOutFrame)` and the film frame is `startFrame + source - sourceInFrame`.
 * @evidence contracts/common.md#clear-and-simple-design Converts each shot's seconds to source frames once, then places those source intervals on every segment of the shot, so the rational frame search and the edit placement stay two separate steps; the input takes only the four effect fields the projection reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing shots are skipped only because the builder's shot-availability diagnostics refuse them, malformed cue seconds are refused rather than clamped, and no tolerance is added to the boundary comparison.
 * @evidence contracts/common.md#meaningful-documentation States the ownership rule and why it matches the sampler, the trim and drop rule, why a missing shot contributes nothing, the output order, and every refused input with its code.
 * @evidence contracts/performance.md#efficient-algorithms For G segments, and E effects per realized shot, the cost is one constant-time frame estimate plus a short boundary walk per bound for each distinct shot, then `O(1)` per effect per segment to trim and place, `O(G * E)` in all with the frame search paid once per shot rather than once per occurrence.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one call each shot's source intervals are computed on its first segment and reused for every later segment of the same shot, keyed by shot id over the caller's immutable-for-the-call shot map; nothing survives the call, so a changed shot set is never answered from a stale entry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The per-shot interval cache grows to at most one entry per distinct realized shot and is released when the call returns; the result array holds new interval records the caller owns.
 */
export const projectProductionShotEffectFilmIntervals = (props: {
  timeline: IAutoMovieFilmEffectClock;
  shots: ReadonlyMap<string, { effects: readonly ShotEffect[] }>;
}): IAutoMovieShotEffectFilmInterval[] => {
  const frameRate: IAutoMovieProductionFrameRate =
    productionFilmEffectTimelineFrameRate(props.timeline);
  const sourceIntervals: Map<string, ISourceInterval[]> = new Map();
  return props.timeline.segments.flatMap(
    (
      segment: IAutoMovieFilmTimelineSegment,
    ): IAutoMovieShotEffectFilmInterval[] => {
      const shot: { effects: readonly ShotEffect[] } | undefined =
        props.shots.get(segment.shot);
      if (shot === undefined) return [];
      let intervals: ISourceInterval[] | undefined = sourceIntervals.get(
        segment.shot,
      );
      if (intervals === undefined) {
        intervals = shot.effects.map(
          (effect: ShotEffect): ISourceInterval =>
            sourceInterval(effect, segment.shot, frameRate),
        );
        sourceIntervals.set(segment.shot, intervals);
      }
      return intervals.flatMap(
        (interval: ISourceInterval): IAutoMovieShotEffectFilmInterval[] => {
          const start: number = Math.max(
            segment.sourceInFrame,
            interval.startFrame,
          );
          const end: number = Math.min(
            segment.sourceOutFrame,
            interval.endFrame,
          );
          return end <= start
            ? []
            : [
                {
                  cue: interval.effect.id,
                  shot: segment.shot,
                  zone: interval.effect.zone,
                  startFrame:
                    segment.startFrame + start - segment.sourceInFrame,
                  endFrame: segment.startFrame + end - segment.sourceInFrame,
                },
              ];
        },
      );
    },
  );
};

/** Convert one effect's second interval to the source frames it owns. */
const sourceInterval = (
  effect: ShotEffect,
  shot: string,
  frameRate: IAutoMovieProductionFrameRate,
): ISourceInterval => {
  const startFrame: number | null =
    Number.isFinite(effect.start) && effect.start >= 0
      ? firstFrameAtOrAfter(effect.start, frameRate)
      : null;
  const endFrame: number | null =
    Number.isFinite(effect.end) && effect.end > effect.start
      ? firstFrameAtOrAfter(effect.end, frameRate)
      : null;
  if (startFrame === null || endFrame === null)
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      `Shot effect cue "${effect.id}" on shot "${shot}" has an invalid or unrepresentable second interval ${effect.start}..${effect.end}.`,
    );
  return { effect, startFrame, endFrame };
};

/**
 * The smallest frame whose exact boundary time is at or after `seconds`, or
 * `null` when no safe-integer frame can represent that boundary.
 *
 * The float product only estimates the frame; the answer is settled by the
 * same boundary comparison the sampler performs, so a product that lands one
 * ulp on the wrong side of an integer cannot move ownership by a frame.
 */
const firstFrameAtOrAfter = (
  seconds: number,
  frameRate: IAutoMovieProductionFrameRate,
): number | null => {
  let frame: number | null = estimateProductionFilmFrame(
    seconds,
    frameRate,
    Math.ceil,
  );
  if (frame === null) return null;
  while (
    frame > 0 &&
    productionFrameBoundaryToSeconds({ frame: frame - 1, frameRate }) >= seconds
  )
    frame -= 1;
  while (productionFrameBoundaryToSeconds({ frame, frameRate }) < seconds)
    frame += 1;
  return frame;
};
