import type {
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieVector3,
} from "@automovie/interface";

import { conductArc } from "./conductArc";

/** The alternatives of `ConductBeats`'s site. */
type ConductBeats = "count" | "period" | "at";

/**
 * Prepare the baton tip's path over a conducted phrase: from the figure's top
 * into the first ictus over the lead before the first beat, then from ictus to
 * ictus on the beat clock, each beat's line lifted by its rebound arc
 * (`conductArc`), and held on the last ictus after the last beat.
 *
 * @param ictus Each beat's ictus, world metres, one per beat.
 * @param top The figure's top, where the preparation starts, world metres.
 * @param beats The beat clock: the count, the period and each beat's second.
 * @param lift The rebound's height at mid-beat, metres.
 * @returns The tip at seconds since the action's start, world metres.
 */
export function conductTip(
  ictus: readonly IAutoMovieVector3[],
  top: IAutoMovieVector3,
  beats: Pick<IAutoMovieMotionHumanDanceBeats, ConductBeats>,
  lift: number,
): (seconds: number) => IAutoMovieVector3 {
  const first: number = beats.at(1);
  const last: number = beats.at(beats.count);
  return (seconds: number): IAutoMovieVector3 => {
    if (seconds <= first) return conductArc(top, ictus[0]!, seconds / first, lift);
    if (seconds >= last) return ictus[ictus.length - 1]!;
    const k: number = Math.min(
      beats.count - 1,
      Math.max(1, Math.floor((seconds - first) / beats.period) + 1),
    );
    return conductArc(
      ictus[k - 1]!,
      ictus[k]!,
      (seconds - beats.at(k)) / (beats.at(k + 1) - beats.at(k)),
      lift,
    );
  };
}
