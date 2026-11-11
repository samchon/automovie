import type { IHumanBody } from "@automovie/motions";

/**
 * Three stubs of the measures a named place reads, metres: an average body
 * 1.7 m tall, a small one 1.5 m tall with narrow shoulders and a tall one 1.9
 * m tall with broad shoulders and long arms. Only `measure` is present.
 */
export const MOTION_VARIATION_BODIES: readonly IHumanBody[] = [
  {
    stature: 1.7,
    upperArm: 0.3,
    forearm: 0.25,
    shoulderHalfWidth: 0.2,
    shoulderHeight: 1.4,
    eyeHeight: 1.6,
    hipHeight: 0.9,
    thigh: 0.4,
    waistHeight: 1.05,
    chestHeight: 1.25,
    neckHeight: 1.48,
  },
  {
    stature: 1.5,
    upperArm: 0.26,
    forearm: 0.22,
    shoulderHalfWidth: 0.16,
    shoulderHeight: 1.22,
    eyeHeight: 1.4,
    hipHeight: 0.78,
    thigh: 0.35,
    waistHeight: 0.92,
    chestHeight: 1.09,
    neckHeight: 1.29,
  },
  {
    stature: 1.9,
    upperArm: 0.36,
    forearm: 0.3,
    shoulderHalfWidth: 0.25,
    shoulderHeight: 1.57,
    eyeHeight: 1.78,
    hipHeight: 1.02,
    thigh: 0.46,
    waistHeight: 1.18,
    chestHeight: 1.4,
    neckHeight: 1.66,
  },
].map((measure): IHumanBody => ({ measure }) as unknown as IHumanBody);
