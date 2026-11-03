import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The lips' own frame: origin at the stomion, the axis running along the
 * commissure line, so every lip piece reads one share `u` of the half mouth
 * width and the contact line's height `mid` there. The contact line is the
 * quadratic `stomion + 1.2 k u^2` (the corners stand 1.2 mm per specimen
 * scale above the middle, the way a resting mouth curves up at its
 * commissures), which the mouth's fissure and the lips' colour boundary share.
 *
 * Reads: the skeleton's half mouth width, stomion and scale. Publishes
 * {@link IFrame} and the shared bulge profile.
 */
export namespace AutoMovieHumanHeadLipFrame {
  /** The lips' measures at one distance from the midline. */
  export interface IFrame {
    /** Distance from the midline over the half mouth width. */
    u: number;

    /** The lips' fall-off toward the corners, `1 - u^2`, never negative. */
    m: number;

    /** Height of the contact line, millimetres. */
    mid: number;
  }

  /**
   * The lips' frame at a distance from the midline, or none beyond the lips'
   * reach of 1.6 half mouth widths.
   *
   * @param plan The landmark skeleton.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns The frame, or `null` past the reach.
   */
  export function at(
    plan: Pick<IAutoMovieHumanHeadLayout, "mouthWidth" | "stomion" | "scale">,
    a: number,
  ): IFrame | null {
    const u: number = a / plan.mouthWidth;
    if (!(u < REACH)) return null;
    return {
      u,
      m: Math.max(0, 1 - u * u),
      mid: plan.stomion + 1.2 * plan.scale * u * u,
    };
  }

  /**
   * One lip's swelling across its height: a bell centred on the lip's middle,
   * as wide as 0.62 of its height (never less than 0.8 mm of specimen scale),
   * as high as the lip's forward lead and falling toward the corners.
   *
   * @param scale Calibration millimetres per world millimetre.
   * @param m The frame's fall-off toward the corners.
   * @param y Height of the point.
   * @param centre Height of the lip's middle.
   * @param height The lip's vermilion height.
   * @param lead The lip's forward lead over the face.
   * @returns Height in millimetres.
   */
  export function bulge(
    scale: number,
    m: number,
    y: number,
    centre: number,
    height: number,
    lead: number,
  ): number {
    return height <= 0
      ? 0
      : lead *
          m ** 0.8 *
          AutoMovieHumanHeadMath.bell((y - centre) / Math.max(0.8 * scale, 0.62 * height));
  }

  /** Reach of the lips' pieces, in half mouth widths: past it the lips have faded into the cheeks. */
  export const REACH: number = 1.6;
}
