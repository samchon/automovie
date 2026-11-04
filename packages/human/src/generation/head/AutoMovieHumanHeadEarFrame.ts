import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLandmarks } from "../IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";

/**
 * One auricle's own frame (`docs/techniques/ear-pieces.md`): `n` the head's
 * outward side at the tragion, `a` the ear's long axis leaning back from the
 * vertical by Banks and Cheney's 15 to 20 degrees (17.5), `b` forward square
 * to both; subaurale at the subnasale's height under the tragion,
 * superaurale the ear length up the long axis from it, the auricle's chord
 * running back from the tragion by its breadth. The rims and hollows of the
 * prior's rows are written for a 31 mm ear and scale with the ear's length.
 */
export namespace AutoMovieHumanHeadEarFrame {
  /** An auricle's frame and sizes, calibration mm. */
  export interface IFrame {
    /** The auricle's centre, midway along its long axis and its chord, on the head's side. */
    centre: [number, number, number];

    /** Outward from the head. */
    n: [number, number, number];

    /** Up the long axis. */
    a: [number, number, number];

    /** Forward along the chord. */
    b: [number, number, number];

    /** Ear length sa-sba. */
    length: number;

    /** Ear breadth. */
    breadth: number;

    /** Protrusion of the rim from the head. */
    protrusion: number;

    /** Millimetres of this ear per millimetre of the prior's 31 mm ear. */
    scale: number;
  }

  /** Lean of the long axis back from the vertical, radians. */
  export const LEAN: number = (17.5 * Math.PI) / 180;

  /** The ear length the prior's rim and hollow rows are written for, mm. */
  export const PRIOR_LENGTH: number = 31;

  /**
   * One side's frame.
   *
   * @param plan The landmark skeleton.
   * @param sign 1 for the left ear, -1 for the right.
   * @param ear The ear's inputs, world mm.
   */
  export function of(plan: IAutoMovieHumanHeadLayout, sign: 1 | -1, ear: IAutoMovieHumanEar): IFrame {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const k: number = plan.scale;
    const length: number = ear.length * k;
    const breadth: number = ear.breadth * k;
    const a: [number, number, number] = [-Math.sin(LEAN), Math.cos(LEAN), 0];
    const b: [number, number, number] = [Math.cos(LEAN), Math.sin(LEAN), 0];
    const z: number = sign * (plan.breadth / 2) * AutoMovieHumanHeadPrior.PRIOR.frame.base;
    const base: [number, number, number] = [m.tragion[0], plan.subnasale, z];
    return {
      centre: [
        base[0] + (a[0] * length) / 2 - (b[0] * breadth) / 2,
        base[1] + (a[1] * length) / 2 - (b[1] * breadth) / 2,
        z,
      ],
      n: [0, 0, sign],
      a,
      b,
      length,
      breadth,
      protrusion: ear.protrusion * k,
      scale: length / (PRIOR_LENGTH * k),
    };
  }
}
