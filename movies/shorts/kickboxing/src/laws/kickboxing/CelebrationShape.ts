import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "./IBoutPosture";
import type { IFighterMeasure } from "./IFighterMeasure";
import { KickboxingTiming } from "./KickboxingTiming";

/**
 * The winner's celebration: both gloves thrown overhead with the chest open
 * and excited breath, then one glove pumping in time with his quick steps
 * before both rise again.
 *
 * ```ts
 * CelebrationShape.posture(measure, guard, seconds);
 * ```
 *
 * @evidence docs/body/screenplay/kickboxing.md#s12-b02 Both gloves overhead, chest open, excited breath, quick supported steps, one glove pumped before both lift again.
 * @evidence docs/body/settings/cast/fighter-a.md#through-bout Raised gloves, turning, quick supported steps, excited breath, clear of B.
 */
export namespace CelebrationShape {
  /** Seconds of the first double-glove raise before the pumping begins: four steps at the stepping cadence. */
  const RAISE: number = 4 * KickboxingTiming.STEP_PERIOD;

  /**
   * The celebrating posture at seconds since its start.
   *
   * @param measure The winner's measure.
   * @param guard His guard posture, for its stance.
   * @param seconds Seconds since the celebration began.
   * @returns The posture.
   * @evidence docs/body/screenplay/kickboxing.md#s12-b02 The raise, pump and second raise.
   */
  export function posture(
    measure: IFighterMeasure,
    guard: IBoutPosture,
    seconds: number,
  ): IBoutPosture {
    const top: number = measure.shoulder - guard.drop + measure.armReach * 0.85;
    const high = (
      side: 1 | -1,
    ): { point: { x: number; y: number; z: number } } => ({
      point: {
        x: measure.headRadius,
        y: top,
        z: side * measure.shoulderHalfWidth * 1.3,
      },
    });
    // After the first raise the right glove pumps once per step pair.
    const pumping: boolean = seconds > RAISE && seconds < RAISE * 3;
    const pump: number = pumping
      ? 0.5 -
        0.5 *
          Math.cos(
            (2 * Math.PI * (seconds - RAISE)) /
              (2 * KickboxingTiming.STEP_PERIOD),
          )
      : 0;
    return {
      ...guard,
      yaw: 0,
      thoracic: { flexion: -8, lateralFlexion: 0, rotation: 0 },
      cervical: { flexion: -10, lateralFlexion: 0, rotation: 0 },
      hands: {
        left: high(1),
        right: {
          point: {
            x: measure.headRadius * (1 + pump),
            y: top - pump * measure.armReach * 0.5,
            z: -measure.shoulderHalfWidth * 1.3,
          },
        },
      },
      jaw: 25 + 10 * Math.abs(Math.sin(seconds * Math.PI * 2)),
      wince: 0,
    };
  }

  /**
   * The winner's arm raised by the referee: held at the wrist and lifted
   * straight up over his shoulder, the arm nearly extended.
   *
   * His free glove lifts with it for {@link FREE_LIFT} seconds from the
   * raise, then comes back down.
   *
   * @param measure The winner's measure.
   * @param posture His posture of the instant, for its drop.
   * @param since Seconds since the referee began the raise.
   * @returns The posture with the arm up.
   * @evidence docs/body/screenplay/kickboxing.md#s12-b04 The referee raises A's arm; A lifts his free glove briefly, then lowers it.
   */
  export function raised(
    measure: IFighterMeasure,
    posture: IBoutPosture,
    since: number,
  ): IBoutPosture {
    const free: number = Math.max(
      0,
      Math.min(1, since / FREE_RISE, (FREE_LIFT - since) / FREE_RISE),
    );
    const lowered = posture.hands.left.point;
    const lifted = {
      x: measure.headRadius,
      y: measure.shoulder - posture.drop + measure.armReach * RAISED_REACH,
      z: measure.shoulderHalfWidth,
    };
    return {
      ...posture,
      hands: {
        left: {
          point: {
            x: lowered.x + (lifted.x - lowered.x) * free,
            y: lowered.y + (lifted.y - lowered.y) * free,
            z: lowered.z + (lifted.z - lowered.z) * free,
          },
        },
        right: {
          point: {
            x: measure.headRadius,
            y: measure.shoulder - posture.drop + measure.armReach * RAISED_REACH,
            z: -measure.shoulderHalfWidth,
          },
        },
      },
    };
  }

  /**
   * Standing relaxed after the bout, no longer fighting: square to the
   * fallen man he faces, the gloves lowered to the waist, looking down at
   * him.
   *
   * @param measure His measure.
   * @param guard His guard posture.
   * @returns The posture.
   * @evidence docs/body/screenplay/kickboxing.md#s12-b03 A stands over B without threat.
   */
  export function relax(
    measure: IFighterMeasure,
    guard: IBoutPosture,
  ): IBoutPosture {
    const waist = (side: 1 | -1): { point: IAutoMovieVector3 } => ({
      point: {
        x: measure.headRadius * WAIST_REACH,
        y: measure.hip + (measure.shoulder - measure.hip) * WAIST_SHARE,
        z: side * measure.shoulderHalfWidth,
      },
    });
    return {
      ...guard,
      drop: 0,
      yaw: 0,
      thoracic: { flexion: RELAXED_TRUNK, lateralFlexion: 0, rotation: 0 },
      cervical: { flexion: RELAXED_NECK, lateralFlexion: 0, rotation: 0 },
      hands: { left: waist(1), right: waist(-1) },
      wince: 0,
    };
  }

  /** Seconds the winner's free glove stays up with the raise: about a second, "briefly" (s12-b04). */
  const FREE_LIFT: number = 1;

  /** Seconds the free glove takes to go up, and again to come down. */
  const FREE_RISE: number = 0.2;

  /** Share of the arm's reach the raised arm stands above the shoulder: nearly straight, the elbow just unlocked. */
  const RAISED_REACH: number = 0.95;

  /** Height of the relaxed gloves above the hip joints, as a share of the hip-to-shoulder height: hanging at the waist. */
  const WAIST_SHARE: number = 0.15;

  /** Forward reach of the relaxed gloves, in head radii: just in front of the hips. */
  const WAIST_REACH: number = 1.5;

  /** Neck flexion standing relaxed, degrees: looking down at the fallen man a stride ahead, the eye line dropping about 1.6 m over 1.5 m; the neck carries half of it and the trunk a quarter (staging reading of s12-b03). */
  const RELAXED_NECK: number = 25;

  /** Trunk flexion standing relaxed over the fallen man, degrees. */
  const RELAXED_TRUNK: number = 10;
}
