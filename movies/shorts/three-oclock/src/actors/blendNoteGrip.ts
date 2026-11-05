import type { IAutoMovieHumanHandPose } from "@automovie/human";

/**
 * Open the existing fitted fingers without changing their hand carrier.
 *
 * @evidence contracts/common.md#implementation-and-ownership Interpolates the actual fitted digit angles toward the evaluator's zero/open clinical seed. The actual measured skin/paper contact, not this weight, determines detachment. Weight1 returns the same fitted angles and preserves the accepted opening. No bone, bound or mesh changes.
 * @evidence contracts/common.md#authoring-interface Returns an independent hand pose for a finite weight in0–1. No previous frame or resource is retained. This is a pose intention, not a friction or grasp certificate.
 */
export function blendNoteGrip(hand: IAutoMovieHumanHandPose, weight: number): IAutoMovieHumanHandPose {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new Error("Grip weight must be finite in0–1");
  return Object.fromEntries(Object.entries(hand).filter(([, angles]): boolean => angles !== undefined).map(([digit, angles]): [string, object] => [digit,
    Object.fromEntries(Object.entries(angles as Record<string, number | undefined>).filter(([, angle]): boolean => angle !== undefined).map(([name, angle]): [string, number] => {
      if (!Number.isFinite(angle)) throw new Error("Grip angles must be finite");
      return [name, angle! * weight];
    }))])) as IAutoMovieHumanHandPose;
}
