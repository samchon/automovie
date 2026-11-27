import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * An artistic figure's schedule over its 4 s: the flat scull, the support scull
 * from 1.35 s, the figure at 2.3 s and the return from 3.15 s, all delayed by
 * 0.35 s per phase step; an assisted role grips 0.14 s either side of the
 * figure (`supportAcquire`, `supportRelease`). A flyer bears on its two bases
 * (World Aquatics Artistic Swimming Manual, Group B), its left foot on the left
 * base's right palm and its right foot on the right base's left palm, the hands
 * nearest the group's middle. The timing is authored for this film figure.
 *
 * @param subject The performer.
 * @param params The performer's role, its bases when it flies, and its phase.
 * @returns The schedule.
 * @throws {HumanRefusal} When a flyer has no bases, two of the same, or itself
 *   among them.
 */
export function aquaticArtisticSchedule(
  subject: string,
  params: aquaticArtisticSchedule.IParams,
): aquaticArtisticSchedule.ISchedule {
  const lifted: boolean = params.role === "flyer";
  const bases: readonly [string, string] | undefined = lifted
    ? params.bases
    : undefined;
  if (
    lifted &&
    (bases === undefined || bases[0] === bases[1] || bases.includes(subject))
  )
    throw new HumanRefusal({
      kind: "participant",
      axis: "bases",
      value: bases ?? null,
      reason: "an assisted flyer needs two distinct supporting swimmers",
      fix: "name two other performers as the flyer's left and right bases",
    });
  const assisted: boolean = lifted || params.role === "base";
  const duration: number = aquaticArtisticSchedule.DURATION;
  const lag: number = 0.35 * (params.phase ?? 0);
  const vertical: number = 1.35 + lag;
  const high: number = 2.3 + lag;
  const back: number = 3.15 + lag;
  const gripStart: number = high - 0.14;
  const gripEnd: number = high + 0.14;
  return {
    bases,
    vertical,
    high,
    back,
    gripStart,
    gripEnd,
    events: [
      { name: "flatScull", share: 0 },
      { name: "supportScull", share: vertical / duration },
      ...(assisted
        ? [{ name: "supportAcquire", share: gripStart / duration }]
        : []),
      { name: "figure", share: high / duration },
      ...(assisted
        ? [{ name: "supportRelease", share: gripEnd / duration }]
        : []),
      { name: "return", share: back / duration },
      { name: "relax", share: 1 },
    ],
    contacts:
      bases === undefined
        ? []
        : (["left", "right"] as const).map(
            (
              side: AutoMovieHumanSide,
              i: number,
            ): IAutoMovieMotionHumanContactWindow => ({
              part: `${side}Foot`,
              kind: "bear",
              from: gripStart / duration,
              to: gripEnd / duration,
              support: {
                kind: "person",
                subject: bases[i]!,
                region: side === "left" ? "palmRight" : "palmLeft",
              },
            }),
          ),
  };
}

/** The artistic figure's schedule. */
export namespace aquaticArtisticSchedule {
  /** The figure's seconds. */
  export const DURATION: number = 4;

  /** What the schedule reads of the performer's parameters. */
  export interface IParams {
    /** The performer's part in the figure. */
    role?: string;

    /** The flyer's left and right bases. */
    bases?: readonly [string, string];

    /** The performer's delay in 0.35 s steps. */
    phase?: number;
  }

  /** The figure's marks, its cues and the flyer's support windows. */
  export interface ISchedule {
    /** The flyer's bases; none for another role. */
    bases: readonly [string, string] | undefined;

    /** The support scull's start, seconds. */
    vertical: number;

    /** The figure's peak, seconds. */
    high: number;

    /** The return's start, seconds. */
    back: number;

    /** The grip's start, seconds. */
    gripStart: number;

    /** The grip's end, seconds. */
    gripEnd: number;

    /** The figure's cues. */
    events: IAutoMovieMotionEvent[];

    /** The flyer's feet borne on its bases' palms. */
    contacts: IAutoMovieMotionHumanContactWindow[];
  }
}
