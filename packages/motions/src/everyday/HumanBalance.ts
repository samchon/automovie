import type { IAutoMovieBodyMeasure } from "@automovie/interface";

/**
 * How far the hips move back when the trunk pitches forward over planted
 * feet, so the body's centre of mass stays over the feet.
 *
 * TEMPORARY: this is a closed-form estimate standing in for the engine's
 * whole-body centre of mass and margin of stability (Hof et al. 2005), which
 * are being added to the engine; it is replaced by them in the first commit
 * after they land, and it is the one place everyday laws ask for a balance
 * correction so that switch touches nothing else. The estimate uses Winter's segment table
 * (Biomechanics and Motor Control of Human Movement, 4th ed., table 4.1): the
 * head, arms and trunk (HAT) carry 0.678 of the body's mass with their centre
 * 0.626 of the hip-to-shoulder length above the hips. Pitching the HAT by
 * `theta` about the hips moves its centre forward by `0.626 L sin(theta)`;
 * moving the hips back by `x` carries the HAT back by `x` and the legs, the
 * remaining 0.322 of the mass, back by about `x / 2` (their centre lies about
 * halfway between the hips and the planted ankles). Setting the whole-body
 * shift to zero gives
 * `x = 0.678 * 0.626 L sin(theta) / (0.678 + 0.161) = 0.506 L sin(theta)`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derives the coefficient and states it is a placeholder for the engine's centre of mass.
 * @evidence contracts/development/implementation.md#principled-implementation Moment balance over Winter's anthropometric mass fractions.
 */
export namespace HumanBalance {
  /**
   * The hips' backward shift for a forward trunk pitch.
   *
   * @param measure The body.
   * @param pitch Trunk pitch forward, degrees.
   * @returns Metres backward; negative for a backward pitch.
   */
  export function hipShift(measure: IAutoMovieBodyMeasure, pitch: number): number {
    const L: number = measure.shoulderHeight - measure.hipHeight;
    return 0.506 * L * Math.sin((pitch * Math.PI) / 180);
  }
}
