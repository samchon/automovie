import type {
  AutoMovieHumanSexPair,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanLegWalk,
} from "@automovie/interface";

import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanLegSectionProportion } from "../AutoMovieHumanLegSectionProportion";
import { AutoMovieHumanLegSites } from "../AutoMovieHumanLegSites";
import { AutoMovieHumanSuprapatella } from "../AutoMovieHumanSuprapatella";

/**
 * Leg tape definitions in calibration millimetres for the prepared walk. Each
 * girth stands at its own landmark. The bone-normal section uses the circular
 * prior in AutoMovieHumanLegSectionProportion and divides its support equally
 * about the course, pending independent section depths.
 */
export namespace AutoMovieHumanLegLaws {
  /** ANSUR II midpatella height over stature, women and men. */
  export const MIDPATELLA: AutoMovieHumanSexPair<number> = [0.276, 0.278];

  /**
   * Bind the person's public girths and their independent surface sites.
   *
   * @param measures Resolved body measurements in world millimetres.
   * @param scale Calibration millimetres per world millimetre.
   * @param _knee The caller's skeletal knee height in calibration millimetres.
   * @param malleolus Lateral malleolus height in calibration millimetres.
   * @param ankle The ankle tape height in calibration millimetres.
   * @param crotch Crotch height in calibration millimetres.
   * @param _side Side of the leg. Centred sections are invariant under
   *   reflection.
   * @returns Site laws in calibration millimetres.
   */
  export function of(
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    _knee: number,
    malleolus: number,
    ankle: number,
    crotch: number,
    _side: "left" | "right",
  ): IAutoMovieHumanLegWalk.ILaw {
    const female: boolean = measures.sex === AutoMovieHumanSex.Female;
    const patella: number =
      MIDPATELLA[female ? 0 : 1] * measures.stature * scale;

    /** A tape's circular box centred on the course. */
    const law = (
      height: number,
      girth: number,
    ): IAutoMovieHumanLegWalk.ISiteLaw => {
      const span: number = (height - malleolus) / (crotch - malleolus);
      const { breadth, depth } = AutoMovieHumanLegSectionProportion.box(
        girth,
        span,
      );
      return {
        height,
        edges: [depth / 2, breadth / 2, -depth / 2, -breadth / 2],
        girth,
      };
    };
    const laws: Record<string, IAutoMovieHumanLegWalk.ISiteLaw> = {
      thigh: law(
        measures.glutealFurrowHeight * scale,
        measures.thighCircumference * scale,
      ),
      lowerThigh: law(
        AutoMovieHumanSuprapatella.height(measures) * scale,
        measures.lowerThighCircumference * scale,
      ),
      knee: law(patella, measures.kneeCircumference * scale),
      calf: law(
        AutoMovieHumanLegSites.calf(
          measures,
          malleolus / scale,
          patella / scale,
        ) * scale,
        measures.calfCircumference * scale,
      ),
      ankle: law(ankle, measures.ankleCircumference * scale),
    };

    const resolve: IAutoMovieHumanLegWalk.ILaw = (
      site: string,
    ): IAutoMovieHumanLegWalk.ISiteLaw => {
      const found: IAutoMovieHumanLegWalk.ISiteLaw | undefined = laws[site];
      if (found === undefined)
        throw new Error(`No leg law at the site ${site}`);
      return found;
    };
    return Object.assign(resolve, { intermediate: [] });
  }
}
