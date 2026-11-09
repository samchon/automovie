import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";

/**
 * The anterior midline from IJ down the sternum, as two leaning bones joined
 * at the sternal angle (Louis), the skin their outward offset.
 *
 * The manubrium and the sternal body meet at the manubriosternal angle,
 * 163.75 +- 5.79 degrees in 103 women and 162.21 +- 6.17 in 97 men
 * (Atesoglu, Deniz and Uslu 2018, Folia Morphol 77(3):489-497,
 * doi:10.5603/FM.a2018.0002, multidetector CT of 200 adults aged 18 to 87:
 * a line along the manubrium through the middle of the jugular notch against
 * a line along the corpus sterni). The angle opens backward, so the body
 * stands `180 - angle` degrees nearer the vertical than the manubrium. Their
 * standing lean is an input gap (searched 2026-11-08: no upright sternal
 * inclination of young adults read; an inclinometer reference exists for the
 * elderly, Geriatr Gerontol Int 2016, doi:10.1111/ggi.12600, values not read),
 * so the lean follows from the forward offset S00 solves at the bust (the
 * ANSUR chest depth): the manubrium's drop times `tan(body + bend)` plus the
 * body's drop to the bust times `tan(body)` is that offset.
 *
 * Over a convex bony corner, skin of uniform thickness is a circular arc
 * whose middle tangent bisects the two bones' directions, so at the sternal
 * angle the skin leans by the mean of the two leans.
 */
export namespace AutoMovieHumanTrunkSternum {
  /** Manubriosternal angle, degrees, women / men (Atesoglu et al. 2018, abstract and Materials and Methods). */
  export const MANUBRIOSTERNAL_ANGLE: readonly [number, number] = [163.75, 162.21];

  /** The midline's readings at the sternal angle. */
  export interface IOutput {
    /** The manubrium's lean from the vertical, radians (forward going down). */
    manubrium: number;

    /** The sternal body's lean from the vertical, radians. */
    body: number;

    /** The skin's forward offset at the sternal angle from IJ, mm. */
    offset: number;

    /** The skin's lean at the sternal angle, radians: the mean of the two leans. */
    lean: number;
  }

  /**
   * The leans from the manubrium's vertical drop (IJ to the sternal angle),
   * the body's drop (sternal angle to the bust) and the midline's forward
   * offset from IJ at the bust, mm, for the person's sex.
   */
  export function of(manubriumDrop: number, bodyDrop: number, offset: number, sex: AutoMovieHumanSex): IOutput {
    const bend: number = ((180 - MANUBRIOSTERNAL_ANGLE[sex === AutoMovieHumanSex.Female ? 0 : 1]) * Math.PI) / 180;
    const reach: (body: number) => number = (body: number): number => manubriumDrop * Math.tan(body + bend) + bodyDrop * Math.tan(body);
    // reach rises monotonically on (-bend, pi / 2 - bend): bisection.
    let lo: number = -bend;
    let hi: number = Math.PI / 2 - bend - 1e-6;
    for (let i: number = 0; i < 80; ++i) {
      const mid: number = (lo + hi) / 2;
      if (reach(mid) < offset) lo = mid;
      else hi = mid;
    }
    const body: number = (lo + hi) / 2;
    const manubrium: number = body + bend;
    return { manubrium, body, offset: manubriumDrop * Math.tan(manubrium), lean: (manubrium + body) / 2 };
  }
}
