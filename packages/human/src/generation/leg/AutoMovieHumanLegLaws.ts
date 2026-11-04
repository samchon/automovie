import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanIllinois } from "../../lofting/AutoMovieHumanIllinois";
import { AutoMovieHumanLegSection } from "../AutoMovieHumanLegSection";
import { AutoMovieHumanLegSites } from "../AutoMovieHumanLegSites";
import { AutoMovieHumanLimbBonePlace } from "../AutoMovieHumanLimbBonePlace";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { AutoMovieHumanLegWalk } from "./AutoMovieHumanLegWalk";

/**
 * A leg's site laws bound for a person (#3048), in calibration millimetres,
 * for `AutoMovieHumanLegWalk`:
 *
 * - Heights: the thigh at the gluteal furrow (ANSUR 1988, the site ISO
 *   8559-1 5.3.20 seeks just below it); the knee at mid-patella, ANSUR II's
 *   midpatella height over stature by sex ({@link MIDPATELLA}, measured); the
 *   calf at ANSUR 1988's calf height share between the lateral malleolus and
 *   mid-patella (`AutoMovieHumanLegSites.calf`); the ankle's least girth at
 *   the caller's height (its site law is pending).
 * - Boxes: at the thigh the published depth (`AutoMovieHumanLegSites.thighDepth`)
 *   and the breadth whose inscribed ellipse runs the tape (the least-
 *   information section of a known depth and perimeter); elsewhere no depth
 *   is published, so the estimated breadth over depth at the site's share of
 *   the ankle-to-crotch span (`AutoMovieHumanLegSection`, estimated from the
 *   private reference set). Each box splits its depth
 *   about the bone by the muscle's front share (`AutoMovieHumanLimbBonePlace`:
 *   thigh above the knee centre, lower leg below) and its breadth evenly (no
 *   published lateral share), so both legs take the same edges and the
 *   right leg is the left's reflection (J6) whichever way `+Z` faces. The
 *   tape owns the fullness at its site.
 */
export namespace AutoMovieHumanLegLaws {
  /** ANSUR II midpatella height over stature, women and men (`docs/sources/ansur-ii.md`). Measured. */
  export const MIDPATELLA: readonly [number, number] = [0.276, 0.278];

  /**
   * One leg's site laws.
   *
   * @param measures The person's resolved measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param knee The knee centre's height, calibration mm (where the femur's front share gives way to the tibia's).
   * @param malleolus The lateral malleolus' height, calibration mm.
   * @param ankle The ankle's least girth's height, calibration mm (pending law).
   * @param crotch The crotch's height, calibration mm, the top of the span the leg's section estimate is read on.
   * @returns The law per site of `AutoMovieHumanLegWalk.SITES`.
   */
  export function of(
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    knee: number,
    malleolus: number,
    ankle: number,
    crotch: number,
  ): (site: string) => AutoMovieHumanLegWalk.ISiteLaw {
    const female: boolean = measures.sex === AutoMovieHumanSex.Female;
    const patella: number = MIDPATELLA[female ? 0 : 1] * measures.stature * scale;
    const frontShare = (height: number): number => AutoMovieHumanLimbBonePlace.front(height >= knee ? "thigh" : "lowerLeg", measures.sex);

    // A site's box from its girth and, where published, its depth.
    const law = (height: number, girth: number, depth: number | null): AutoMovieHumanLegWalk.ISiteLaw => {
      // No published depth: the estimated breadth over depth at the site's
      // share of the ankle-to-crotch span (`AutoMovieHumanLegSection`,
      // estimated from the private reference set: no published source found).
      const span: number = (height - malleolus) / (crotch - malleolus);
      const estimated: { breadth: number; depth: number } = depth === null ? AutoMovieHumanLegSection.box(girth, span) : { breadth: breadth(girth, depth), depth };
      const d: number = estimated.depth;
      const w: number = estimated.breadth;
      const front: number = frontShare(height);
      return { height, edges: [d * front, w / 2, -d * (1 - front), -w / 2], girth };
    };
    const laws: Record<string, AutoMovieHumanLegWalk.ISiteLaw> = {
      thigh: law(measures.glutealFurrowHeight * scale, measures.thighCircumference * scale, AutoMovieHumanLegSites.thighDepth(measures) * scale),
      knee: law(patella, measures.kneeCircumference * scale, null),
      calf: law(AutoMovieHumanLegSites.calf(measures, malleolus / scale, patella / scale) * scale, measures.calfCircumference * scale, null),
      ankle: law(ankle, measures.ankleCircumference * scale, null),
    };
    return (site: string): AutoMovieHumanLegWalk.ISiteLaw => {
      const found: AutoMovieHumanLegWalk.ISiteLaw | undefined = laws[site];
      if (found === undefined) throw new Error(`No leg law at the site ${site}`);
      return found;
    };
  }

  /**
   * The breadth whose inscribed ellipse with a depth has a perimeter: the
   * root of Ramanujan's second approximation by the Illinois rule between the
   * degenerate ellipse (breadth 0, perimeter twice the depth) and the circle's
   * reach far past it.
   *
   * @param girth The perimeter, mm.
   * @param depth The depth, mm.
   * @returns The breadth, mm; the depth itself where the girth cannot be reached.
   */
  function breadth(girth: number, depth: number): number {
    const perimeter = (w: number): number => {
      const a: number = w / 2;
      const b: number = depth / 2;
      const h: number = ((a - b) / (a + b)) ** 2;
      return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    };
    const w: number | null = AutoMovieHumanIllinois.root((x: number): number => perimeter(x) - girth, 1e-6, girth, 1e-6, 100);
    return w ?? depth;
  }
}
