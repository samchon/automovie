import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";

/** The record of `ITypeTextPressesKeysItem`'s site. */
type ITypeTextPressesKeysItem = {
  at: IAutoMovieVector3;
  side: AutoMovieHumanSide;
};

/**
 * Prepare each typing hand's ordered key presses and evaluate the first
 * unfinished press by binary search. A press reaches its key over the `REACH`
 * share of the nominal interval before its time and lifts over the `LIFT` share
 * after it. When the same hand's next press comes sooner than a whole interval,
 * both shares are taken of that hand's actual gap instead, so the lift ends
 * where the next transport starts and the fingertip moves continuously from key
 * to key.
 *
 * @param keys Keys in text order, in the keyboard's local frame.
 * @param times Their strictly increasing press times, seconds.
 * @param interval The nominal key interval, seconds.
 * @param home Each hand's local home key.
 * @param frame The keyboard's fixed world frame.
 * @param hover Fingertip height between presses, metres.
 * @param travel Key depression below the home-row plane, metres.
 * @returns A pure world-space fingertip reader for either hand at any second.
 */
export function typeTextPresses(
  keys: readonly ITypeTextPressesKeysItem[],
  times: readonly number[],
  interval: number,
  home: Record<AutoMovieHumanSide, IAutoMovieVector3>,
  frame: IAutoMovieMotionHumanFrame,
  hover: number,
  travel: number,
): (side: AutoMovieHumanSide, seconds: number) => IAutoMovieVector3 {
  const presses: Record<AutoMovieHumanSide, IPress[]> = { left: [], right: [] };
  const previous: Record<AutoMovieHumanSide, IAutoMovieVector3> = { ...home };
  const transform: HumanFrame.IPrepared = HumanFrame.prepare(frame);
  for (const side of ["left", "right"] as const) {
    const own: number[] = keys
      .map((_: unknown, i: number): number => i)
      .filter((i: number): boolean => keys[i]!.side === side);
    let until: number = 0;
    own.forEach((i: number, j: number): void => {
      const press: number = times[i]!;

      // The spans are shares of the nominal interval, or of the gaps to this
      // hand's neighbouring presses when those are shorter.
      const before: number = j === 0 ? interval : press - times[own[j - 1]!]!;
      const after: number =
        j + 1 < own.length ? times[own[j + 1]!]! - press : interval;
      const reach: number = REACH * Math.min(interval, before);
      const lift: number = LIFT * Math.min(interval, after);
      const start: number = Math.max(until, press - reach);
      presses[side].push({
        at: keys[i]!.at,
        press,
        from: previous[side],
        start,
        span: press - start,
        lift,
        end: press + lift,
      });
      previous[side] = keys[i]!.at;
      until = press + lift;
    });
  }
  const world: (x: number, z: number, height: number) => IAutoMovieVector3 = (
    x: number,
    z: number,
    height: number,
  ): IAutoMovieVector3 => transform.point({ x, y: height, z });
  return (side: AutoMovieHumanSide, seconds: number): IAutoMovieVector3 => {
    const ordered: readonly IPress[] = presses[side];
    let low: number = 0;
    let high: number = ordered.length;
    while (low < high) {
      const middle: number = (low + high) >>> 1;
      if (ordered[middle]!.end <= seconds) low = middle + 1;
      else high = middle;
    }
    const active: IPress | undefined = ordered[low];
    if (active === undefined)
      return world(previous[side].x, previous[side].z, hover);
    if (seconds < active.start)
      return world(active.from.x, active.from.z, hover);
    if (seconds < active.press) {
      const share: number = minimumJerk.share(
        (seconds - active.start) / active.span,
      );
      return world(
        active.from.x + (active.at.x - active.from.x) * share,
        active.from.z + (active.at.z - active.from.z) * share,
        hover - (hover + travel) * share * share,
      );
    }
    const share: number = minimumJerk.share(
      (seconds - active.press) / active.lift,
    );
    return world(active.at.x, active.at.z, -travel + (hover + travel) * share);
  };
}

/** One key's press and the previous key state on the same hand. */
interface IPress {
  /** The pressed key's local position. */
  at: IAutoMovieVector3;

  /** Press instant, seconds since typing starts. */
  press: number;

  /** The previous key or this hand's home key. */
  from: IAutoMovieVector3;

  /**
   * When the fingertip leaves the previous key for this one, seconds since
   * typing starts.
   */
  start: number;

  /**
   * Seconds from `start` to the press, positive since the press times strictly
   * increase.
   */
  span: number;

  /** Seconds the lift takes after the press, positive. */
  lift: number;

  /** This key's completed lift, seconds since typing starts. */
  end: number;
}

/**
 * The share of an interval a fingertip takes to reach its key (provisional: the
 * law's 40 %).
 */
const REACH: number = 0.4;

/**
 * The share of an interval a fingertip takes to lift off its key, the rest of
 * it.
 */
const LIFT: number = 1 - REACH;
