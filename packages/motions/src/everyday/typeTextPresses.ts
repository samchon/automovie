import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanManipulate,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";

/**
 * Prepare each typing hand's ordered key presses and evaluate the first
 * unfinished press by binary search. A preceding key's lift completes before
 * the next key's transport, including when their nominal windows overlap.
 *
 * @param keys Keys in text order, in the keyboard's local frame.
 * @param times Their strictly increasing press times, seconds.
 * @param interval The unchanged nominal key interval, seconds.
 * @param home Each hand's local home key.
 * @param frame The keyboard's fixed world frame.
 * @param hover Fingertip height between presses, metres.
 * @param travel Key depression below the home-row plane, metres.
 * @returns A pure world-space fingertip reader for either hand at any second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States local/world frames, ordered-time premise, nominal interval and overlap ordering, with world-metre output at arbitrary seconds.
 * @evidence contracts/development/implementation.md#principled-implementation Compiles the original chronological press state into per-hand records, then finds the first whose lift has not ended; the same 40 percent reach, 60 percent lift, minimum-jerk profiles and keyboard transform evaluate that record.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One text-order preparation records each hand's previous key and lift end; the returned reader owns only binary selection and the existing transport/press/lift formulas.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no timing, key layout, path, hover height, travel or minimum-jerk denominator guard. NaN seconds keep the chronological loop's all-comparisons-false final-key/home hover result rather than entering a press. Strictly increasing times and a positive interval are supplied by typeText's existing skill-timing plan.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparing N keys costs O(N) time and space; each hand read searches its H ordered presses in O(log H) time and performs one fixed-size path evaluation instead of scanning the full text. Scalar transport coordinates feed the prepared frame directly, omitting an interpolated local vector that was immediately copied with its actual press height.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed text, hand assignment, press times, previous-key states, original approach/overlap boundaries, guarded easing denominators and keyboard frame coefficients are prepared once per typing plan; time-dependent transport, lift and world position are evaluated afresh without a sampled-frame cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader owns two arrays containing N press records and a copied prepared keyboard frame, borrowing the plan's key/home vectors until that plan is released; no population grows during playback or seeking.
 */
export function typeTextPresses(
  keys: readonly { at: IAutoMovieVector3; side: AutoMovieHumanSide }[],
  times: readonly number[],
  interval: number,
  home: Record<AutoMovieHumanSide, IAutoMovieVector3>,
  frame: IAutoMovieMotionHumanFrame,
  hover: number,
  travel: number,
): (side: AutoMovieHumanSide, seconds: number) => IAutoMovieVector3 {
  const presses: Record<AutoMovieHumanSide, IAutoMovieMotionHumanManipulate.IPress[]> = { left: [], right: [] };
  const previous: Record<AutoMovieHumanSide, IAutoMovieVector3> = { ...home };
  const until: Record<AutoMovieHumanSide, number> = { left: 0, right: 0 };
  const reach: number = 0.4 * interval;
  const lift: number = 0.6 * interval;
  const transform: HumanFrame.IPrepared = HumanFrame.prepare(frame);
  for (let i: number = 0; i < keys.length; i++) {
    const key: { at: IAutoMovieVector3; side: AutoMovieHumanSide } = keys[i]!;
    const press: number = times[i]!;
    const approach: number = press - reach;
    const start: number = Math.max(until[key.side], approach);
    presses[key.side].push({
      at: key.at,
      press,
      from: previous[key.side],
      approach,
      start,
      span: Math.max(1e-3, press - start),
      end: press + lift,
    });
    previous[key.side] = key.at;
    until[key.side] = press + lift;
  }
  const world: (x: number, z: number, height: number) => IAutoMovieVector3 = (
    x: number,
    z: number,
    height: number,
  ): IAutoMovieVector3 => transform.point({ x, y: height, z });
  return (side: AutoMovieHumanSide, seconds: number): IAutoMovieVector3 => {
    const ordered: readonly IAutoMovieMotionHumanManipulate.IPress[] = presses[side];
    if (Number.isNaN(seconds)) return world(previous[side].x, previous[side].z, hover);
    let low: number = 0;
    let high: number = ordered.length;
    while (low < high) {
      const middle: number = (low + high) >>> 1;
      if (ordered[middle]!.end <= seconds) low = middle + 1;
      else high = middle;
    }
    const active: IAutoMovieMotionHumanManipulate.IPress | undefined = ordered[low];
    if (active === undefined) return world(previous[side].x, previous[side].z, hover);
    if (seconds < active.approach) return world(active.from.x, active.from.z, hover);
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
    const share: number = minimumJerk.share((seconds - active.press) / lift);
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

  /** The original nominal start of this key's approach, seconds. */
  approach: number;

  /** Approach start after the previous lift's original overlap priority. */
  start: number;

  /** Original 1 ms guarded easing denominator from start to press, seconds. */
  span: number;

  /** This key's completed lift, seconds since typing starts. */
  end: number;
}
