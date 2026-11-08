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
}
