import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanLegSection } from "../AutoMovieHumanLegSection";
import { AutoMovieHumanLegSites } from "../AutoMovieHumanLegSites";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import { AutoMovieHumanLimbBonePlace } from "../AutoMovieHumanLimbBonePlace";
import { AutoMovieHumanSuprapatella } from "../AutoMovieHumanSuprapatella";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { AutoMovieHumanLegWalk } from "./AutoMovieHumanLegWalk";

/**
 * A leg's site laws bound for a person (#3048), in calibration millimetres,
 * for `AutoMovieHumanLegWalk`:
 *
 * - Heights: the thigh at the gluteal furrow (ANSUR 1988, the site ISO
 *   8559-1 5.3.20 seeks just below it); the lower thigh at the suprapatella
 *   (`AutoMovieHumanSuprapatella`: mid-patella plus half the patella's
 *   length); the knee at mid-patella, ANSUR II's
 *   midpatella height over stature by sex ({@link MIDPATELLA}, measured); the
 *   calf at ANSUR 1988's calf height share between the lateral malleolus and
 *   mid-patella (`AutoMovieHumanLegSites.calf`); the ankle's least girth at
 *   the caller's height (its site law is pending).
 * - Boxes: no standing depth is published at any site (the survey's thigh
 *   depth, `AutoMovieHumanLegSites.thighDepth`, is taken seated and
 *   compressed, short of the standing thigh's), so every box is
 *   the estimated breadth over depth at the site's share of the
 *   ankle-to-crotch span (`AutoMovieHumanLegSection`, estimated from the
 *   private reference set). Each box splits its depth about the bone by the
 *   muscle's front share (`AutoMovieHumanLimbBonePlace`: thigh above the
 *   knee centre, lower leg below) and its breadth by the lateral share about
 *   the bone line (`AutoMovieHumanReferenceOutlines.THIGH_SPLIT` from the
 *   knee toward the crotch, `SHANK_SPLIT` from the ankle's site to the knee,
 *   estimated from the private reference set; no published source), the
 *   lateral side `+Z` on the left leg and `-Z` on the right (J6). The tape
 *   owns the fullness at its site.
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
   * @param side The leg, whose lateral side is `+Z` on the left and `-Z` on the right.
   * @returns The law per site of `AutoMovieHumanLegWalk.SITES`.
   */
  export function of(
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    knee: number,
    malleolus: number,
    ankle: number,
    crotch: number,
    side: "left" | "right",
  ): (site: string) => AutoMovieHumanLegWalk.ISiteLaw {
    const female: boolean = measures.sex === AutoMovieHumanSex.Female;
    const patella: number = MIDPATELLA[female ? 0 : 1] * measures.stature * scale;
    const frontShare = (height: number): number => AutoMovieHumanLimbBonePlace.front(height >= knee ? "thigh" : "lowerLeg", measures.sex);

    // The lateral share of the breadth about the bone line: the thigh's from
    // the knee centre toward the crotch, the shank's from the ankle's site to
    // the knee centre.
    const T: typeof AutoMovieHumanReferenceOutlines = AutoMovieHumanReferenceOutlines;
    const lateral = (height: number): number =>
      height >= knee ? T.at(T.THIGH_SPLIT, "lateral", (height - knee) / (crotch - knee)) : T.at(T.SHANK_SPLIT, "lateral", (height - ankle) / (knee - ankle));

    // A site's box from its girth: the estimated breadth over depth at the
    // site's share of the ankle-to-crotch span (`AutoMovieHumanLegSection`,
    // estimated from the private reference set: no published source found).
    const law = (height: number, girth: number): AutoMovieHumanLegWalk.ISiteLaw => {
      const span: number = (height - malleolus) / (crotch - malleolus);
      const box: { breadth: number; depth: number } = AutoMovieHumanLegSection.box(girth, span);
      const front: number = frontShare(height);
      const out: number = lateral(height) * box.breadth;
      const inward: number = box.breadth - out;
      const [plus, minus]: [number, number] = side === "left" ? [out, inward] : [inward, out];
      return { height, edges: [box.depth * front, plus, -box.depth * (1 - front), -minus], girth };
    };
    const laws: Record<string, AutoMovieHumanLegWalk.ISiteLaw> = {
      thigh: law(measures.glutealFurrowHeight * scale, measures.thighCircumference * scale),
      lowerThigh: law(AutoMovieHumanSuprapatella.height(measures) * scale, measures.lowerThighCircumference * scale),
      knee: law(patella, measures.kneeCircumference * scale),
      calf: law(AutoMovieHumanLegSites.calf(measures, malleolus / scale, patella / scale) * scale, measures.calfCircumference * scale),
      ankle: law(ankle, measures.ankleCircumference * scale),
    };
    return (site: string): AutoMovieHumanLegWalk.ISiteLaw => {
      const found: AutoMovieHumanLegWalk.ISiteLaw | undefined = laws[site];
      if (found === undefined) throw new Error(`No leg law at the site ${site}`);
      return found;
    };
  }
}
