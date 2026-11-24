import type { IAutoMovieBodyMeasure } from "@automovie/interface";

/**
 * A typed body measure built from Winter's segment proportions of stature H
 * (Winter, Biomechanics and Motor Control of Human Movement, 4th ed., fig.
 * 4.1): hip 0.530H, shoulder 0.818H, eye 0.936H, upper arm 0.186H, forearm
 * 0.146H, hand 0.108H, thigh 0.245H, shank 0.246H, ankle 0.039H, foot
 * 0.152H by 0.055H, shoulder width 0.259H. The trunk heights between them and
 * the collision radii are round scenic values. Thigh, shank and ankle sum to
 * the hip height, so the record is self-consistent for producers that check
 * it.
 *
 * @param stature Floor to vertex, metres.
 * @param mass Body mass, kilograms.
 * @returns The measure; a fresh record per call.
 */
export function syntheticBodyMeasure(
  stature: number = 1.75,
  mass: number = 75,
): IAutoMovieBodyMeasure {
  const h: number = stature;
  return {
    stature: h,
    mass,
    hipHeight: 0.53 * h,
    hipHalfWidth: 0.05 * h,
    waistHeight: 0.6 * h,
    chestHeight: 0.72 * h,
    neckHeight: 0.84 * h,
    headHeight: 0.91 * h,
    eyeHeight: 0.936 * h,
    headRadius: 0.057 * h,
    shoulderHeight: 0.818 * h,
    shoulderHalfWidth: 0.1295 * h,
    upperArm: 0.186 * h,
    forearm: 0.146 * h,
    hand: 0.108 * h,
    thigh: 0.245 * h,
    shank: 0.246 * h,
    ankleHeight: 0.039 * h,
    footLength: 0.152 * h,
    heel: 0.038 * h,
    footBreadth: 0.055 * h,
    chestDepth: 0.126 * h,
    chestBreadth: 0.171 * h,
    upperArmRadius: 0.026 * h,
    forearmRadius: 0.02 * h,
    thighRadius: 0.043 * h,
    shankRadius: 0.029 * h,
  };
}