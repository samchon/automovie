import { minimumJerk, AutoMovieEngineMotionSampling } from "@automovie/engine";

import { walkLegLow } from "./walkLegLow";

/** Which end of the bracket was kept last: the low, none, or the high. */
type RiseStale = -1 | 0 | 1;

/**
 * The pitch a planted foot's heel rises to so that a room it must keep, which
 * rising the heel buys, never runs out, with the onset rounded.
 *
 * The rounding is done on the room, not the pitch: the foot keeps the room its
 * asked pitch has while that is `width` or more, never less than none, and the
 * smooth maximum of the two in between (the engine's `smoothMinimum`, negated).
 * A straight knee folds the room: the first degrees of heel rise bend the knee
 * and lean the shank faster than they open the ankle, so the room first dips
 * and only then grows, and the pitch that has a given room lies past the dip, a
 * finite step from the asked one. The pitch is therefore searched past the dip:
 * the room is walked down from the asked pitch in `SCAN` steps to its first
 * low, which the rise meets first (the room is not unimodal over the whole
 * range: past the first dip it may dip again), and the kept room is bracketed
 * beyond it, no steeper than `STEEPEST`, from the step before the room grew, or
 * from the low itself by golden-section search where that step keeps the room.
 * A pitch whose ankle lies beyond the leg's reach has no room at all
 * (`-Infinity`): it is no stance, and counting a lean read off a leg stretched
 * past its length made the room cross the kept one twice, the pitch jumping
 * between the crossings as the hip moved by nanometres. An asked pitch the leg
 * cannot stand on is first raised to the least rise that brings the ankle
 * within reach, and the rule goes on from there. The foot moves from its asked
 * pitch to the kept room's on a minimum-jerk weight (Flash and Hogan 1985) as
 * the asked room runs from `width` down to none, so the heel's rate is
 * continuous where the rule takes over or lets go. The step past the dip is
 * crossed in the time the asked room takes to run through `width`, so its
 * acceleration falls with the square of the width.
 *
 * A room that only grows as the heel rises has no dip, and the pitch that keeps
 * the smooth maximum is already continuous in rate with the least acceleration
 * a rounding of that width can have; the weight would only steepen it. Such a
 * rule says so with `folds` and takes that pitch itself.
 *
 * @param room The room a pitch leaves, degrees; `Infinity` where the rule asks
 *   nothing of that pitch, `-Infinity` where the leg cannot stand on it.
 * @param pitch The asked pitch, degrees, negative toes-down.
 * @param width The room, degrees, under which the heel begins to rise; zero
 *   keeps the asked pitch until the room is none.
 * @param folds Whether the room may dip before it grows as the heel rises.
 * @param beyond The native reach-only reading equivalent to negative infinite
 *   room, when available.
 * @param boundary The native circular reach boundary rounded onto the original
 *   bracket lattice, if certified.
 * @returns The pitch, no higher than the asked one.
 */
export function walkLegRise(
  room: (degrees: number) => number,
  pitch: number,
  width: number,
  folds: boolean = true,
  beyond?: (degrees: number) => boolean,
  boundary?: (low: number, high: number) => number | undefined,
): number {
  // An asked pitch the leg cannot stand on is first raised to the least
  // rise that brings its ankle within the leg's reach, which is continuous
  // with the asked pitch as the reach is lost; the rule then reads that
  // pitch as the asked one.
  let asked: number = room(pitch);
  if (asked === -Infinity) {
    const unreachable =
      beyond ?? ((degrees: number): boolean => room(degrees) === -Infinity);
    if (unreachable(-STEEPEST)) return -STEEPEST;
    pitch =
      boundary?.(-STEEPEST, pitch) ??
      reachBracket(-STEEPEST, pitch, unreachable);
    asked = room(pitch);
  }
  if (asked >= width || pitch <= -STEEPEST) return pitch;
  const kept: number =
    width > 0 ? -AutoMovieEngineMotionSampling.smoothMinimum(-asked, 0, width) : Math.max(asked, 0);
  // The dip is the first low of the room as the heel rises from the asked
  // pitch: walked down in `SCAN` steps until the room grows again, so it is
  // the one the rise meets first. It is wanted only as an end of the kept
  // room's bracket that does not keep the room, which the step before the
  // room grew is when its room is under the kept one: the room has one low
  // between the steps around it (`SCAN`), so it stays under that step's up
  // to the low. Any other walk has its low narrowed by golden section.
  let low: number = -STEEPEST;
  let high: number = pitch;
  if (folds) {
    let far: number = -STEEPEST;
    let near: number = pitch;
    let before: number = asked;
    let lowest: number = pitch;
    let grew: boolean = false;
    for (let at: number = pitch - SCAN; at > -STEEPEST; at -= SCAN) {
      const value: number = room(at);
      // Pitches the leg cannot stand on lie before the dip, not in it.
      if (value > before && before > -Infinity) {
        far = Math.max(-STEEPEST, at);
        near = Math.min(pitch, at + 2 * SCAN);
        grew = true;
        break;
      }
      before = value;
      lowest = at;
    }
    if (grew && before < kept) high = lowest;
    else {
      [far, near] = walkLegLow(room, far, near);
      high = (far + near) / 2;
    }
  }
  // The kept room's pitch, bracketed between a pitch that keeps it and one
  // that does not, to `RESOLVED`: a false-position step where both ends'
  // rooms are finite, the stale end's value halved when it is kept twice
  // (the Illinois rule, Dowell and Jarratt 1971), and a bisection step
  // where an end has no room to read (a rule that asks nothing, a leg that
  // cannot stand), so the bracket closes superlinearly on a smooth room
  // and never slower than by halves.
  let above: number = room(low) - kept;
  if (above >= 0) {
    let below: number = -Infinity;
    let stale: RiseStale = 0;
    for (let k: number = 0; k < 2 * HALVINGS && high - low > RESOLVED; k++) {
      const secant: number =
        above < Infinity && below > -Infinity
          ? low + ((high - low) * above) / (above - below)
          : NaN;
      const middle: number =
        secant > low && secant < high ? secant : (low + high) / 2;
      const value: number = room(middle) - kept;
      if (value < 0) {
        high = middle;
        below = value;
        if (stale === 1) above /= 2;
        stale = 1;
      } else {
        low = middle;
        above = value;
        if (stale === -1) below /= 2;
        stale = -1;
      }
    }

    // A room with a kink can hold one end still; halves close what is left.
    for (let k: number = 0; k < HALVINGS && high - low > RESOLVED; k++) {
      const middle: number = (low + high) / 2;
      if (room(middle) < kept) high = middle;
      else low = middle;
    }
  }
  if (!folds) return low;
  const share: number =
    width > 0 ? Math.min(1, Math.max(0, (width - asked) / width)) : 1;
  return pitch + (low - pitch) * minimumJerk.share(share);
}

/**
 * The width, degrees, a kept room's pitch is bracketed to: under a hundred
 * nanometres of any point of a foot, the resolution thirty halvings of the
 * widest bracket gave.
 */
const RESOLVED: number = 1e-7;

/**
 * The step, degrees, in which the rise walks the room down from the asked pitch
 * to find its first low: half a degree, under which the room of a leg near
 * straight has no second low.
 */
const SCAN: number = 0.5;

/**
 * The steepest heel rise of a planted foot, degrees toes-down (provisional):
 * past it the foot would stand on its toe tips.
 */
const STEEPEST: number = 75;

/**
 * The halvings that take the widest bracket, `STEEPEST` degrees, under
 * `RESOLVED`: ⌈log₂(75 / 1e-7)⌉ = 30. The Illinois steps are allowed twice as
 * many, since a stale end is halved at least every second step (Dowell and
 * Jarratt 1971), and the bisection that follows closes whatever a kink left in
 * as many again.
 */
const HALVINGS: number = Math.ceil(Math.log2(STEEPEST / RESOLVED));

/** The heel rise's bracketing resolutions shared with its callers. */
export namespace walkLegRise {
  /**
   * The width, degrees, to which the least standable pitch of an unreachable
   * asked one is bisected: a millionth of a degree turns a point of a 0.3 m
   * foot by 5 nm, under the micrometre a pose is read to, and ⌈log₂(75 / 1e-6)⌉
   * = 27 halvings reach it from the widest bracket.
   */
  export const REACHED: number = 1e-6;
}
/**
 * Lower endpoint of the original reach bracket for a non-circular or unverified
 * input.
 */
function reachBracket(
  low: number,
  high: number,
  unreachable: (pitch: number) => boolean,
): number {
  while (high - low > walkLegRise.REACHED) {
    const middle: number = (high + low) / 2;
    if (unreachable(middle)) high = middle;
    else low = middle;
  }
  return low;
}
