import {
  IAutoMovieFilmTimelineSegment,
  IAutoMovieProductionFrameRate,
  type IAutoMovieProjectProductionShotEffectFilmIntervals,
  type IAutoMovieShotEffect,
  type IAutoMovieShotEffectFilmInterval,
} from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../../film/internal/productionFrameBoundaryToSeconds";
import { AutoMovieFilmEffectRuntimeError } from "../AutoMovieFilmEffectRuntimeError";
import { estimateProductionFilmFrame } from "./estimateProductionFilmFrame";
import { productionFilmEffectTimelineFrameRate } from "./productionFilmEffectTimelineFrameRate";

/*
 * Project every shot-owned effect occurrence onto the film's half-open frame
 * clock.
 *
 * A shot cue owns the source frames whose exact boundary time satisfies `start
 * <= time < end`, the same comparison the engine sampler performs, so the
 * projection is decided by the rational frame boundary rather than by a rounded
 * `seconds * fps` product. Each film occurrence of the shot is trimmed to its
 * segment and dropped when nothing remains, and a shot the compiled set does
 * not contain contributes no interval because the builder's shot-availability
 * diagnostics own that refusal. Intervals come out in segment order, then in
 * the shot's effect order. A cue with a negative or non-finite start, an end
 * not after its start, or an unrepresentable bound throws
 * `AutoMovieFilmEffectRuntimeError` with `film-effect-input-invalid`, as does
 * an inconsistent clock.
 */
export const projectProductionShotEffectFilmIntervals = (
  props: IAutoMovieProjectProductionShotEffectFilmIntervals.IProps,
): IAutoMovieShotEffectFilmInterval[] => {
  const frameRate: IAutoMovieProductionFrameRate =
    productionFilmEffectTimelineFrameRate(props.timeline);
  const sourceIntervals: Map<string, ISourceInterval[]> = new Map();
  return props.timeline.segments.flatMap(
    (
      segment: IAutoMovieFilmTimelineSegment,
    ): IAutoMovieShotEffectFilmInterval[] => {
      const shot: { effects: readonly IAutoMovieShotEffect[] } | undefined =
        props.shots.get(segment.shot);
      if (shot === undefined) return [];
      let intervals: ISourceInterval[] | undefined = sourceIntervals.get(
        segment.shot,
      );
      if (intervals === undefined) {
        intervals = shot.effects.map(
          (effect: IAutoMovieShotEffect): ISourceInterval =>
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

/*
 * One shot effect with the half-open source-frame interval it owns.
 */
interface ISourceInterval {
  effect: IAutoMovieShotEffect;
  startFrame: number;
  endFrame: number;
}

/*
 * Convert one effect's second interval to the source frames it owns.
 */
const sourceInterval = (
  effect: IAutoMovieShotEffect,
  shot: string,
  frameRate: IAutoMovieProductionFrameRate,
): ISourceInterval => {
  const startFrame: number | null =
    effect.start >= 0 ? firstFrameAtOrAfter(effect.start, frameRate) : null;
  const endFrame: number | null =
    effect.end > effect.start
      ? firstFrameAtOrAfter(effect.end, frameRate)
      : null;
  if (startFrame === null || endFrame === null)
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      `Shot effect cue "${effect.id}" on shot "${shot}" has an invalid or unrepresentable second interval ${effect.start}..${effect.end}.`,
    );
  return { effect, startFrame, endFrame };
};

/*
 * The smallest frame whose exact boundary time is at or after `seconds`, or
 * `null` when no safe-integer frame can represent that boundary.
 *
 * The float product only estimates the frame; the answer is settled by the same
 * boundary comparison the sampler performs, so a product that lands one ulp on
 * the wrong side of an integer cannot move ownership by a frame.
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
