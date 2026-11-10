import { AutoMovieNaturalSpline } from "@automovie/engine";

import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanLegSectionProportion } from "../AutoMovieHumanLegSectionProportion";
import { AutoMovieHumanLegSites } from "../AutoMovieHumanLegSites";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import { AutoMovieHumanSuprapatella } from "../AutoMovieHumanSuprapatella";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanLegBones } from "./AutoMovieHumanLegBones";
import { AutoMovieHumanLegGirth } from "./AutoMovieHumanLegGirth";
import { AutoMovieHumanLegMassPrior } from "./AutoMovieHumanLegMassPrior";
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
 *   ankle-to-crotch span (`AutoMovieHumanLegSectionProportion`, estimated from the
 *   private reference set). Each box splits its whole skin depth by the
 *   retained skin-support front share (`AutoMovieHumanLegMassPrior`), not
 *   a one-site muscle-thickness ratio. Those old level, sampled body-X
 *   supports and reference-rig lines transfer here to the current pure
 *   bone-normal chart as an explicit proxy. A natural C2 profile connects
 *   the actual segment-share rows across their unmeasured knee gap; values
 *   beyond the outer rows are held, with no invented joint measurement.
 *   The breadth splits by the lateral share about
 *   the bone line (`AutoMovieHumanReferenceOutlines.THIGH_SPLIT` from the
 *   knee toward the crotch, `SHANK_SPLIT` from the ankle's site to the knee,
 *   estimated from the private reference set; no published source), the
 *   lateral side `+Z` on the left leg and `-Z` on the right (J6). The tape
 *   owns the fullness at its site.
 * - Intermediate thigh shape: the retained LegGirth.THIGH normalized girth
 *   rows between the public thigh and lower-thigh sites are placed on the
 *   current hip-to-knee height span. The same box/split owners read them for
 *   all four edges. Only that existing table is consumed, not its old C1
 *   girth interpolator or old skin. This preserves a declared aggregate
 *   proxy instead of allowing the sparse five-site/pole spline to invent
 *   the intervening bulge; continuous world admission remains separate.
 */
export namespace AutoMovieHumanLegLaws {
  /** ANSUR II midpatella height over stature, women and men (`docs/sources/ansur-ii.md`). Measured. */
  export const MIDPATELLA: readonly [number, number] = [0.276, 0.278];

  /**
   * One leg's site laws.
   *
   * @param measures The person's resolved measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param knee The knee centre's height, calibration mm, placing the segment-share prior rows.
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
  ): AutoMovieHumanLegWalk.ILaw {
    const female: boolean = measures.sex === AutoMovieHumanSex.Female;
    const patella: number =
      MIDPATELLA[female ? 0 : 1] * measures.stature * scale;
    const hip: number = AutoMovieHumanLegBones.HIP * measures.stature * scale;
    const rows: { height: number; value: number }[] = [
      ...AutoMovieHumanLegMassPrior.THIGH.map(
        (
          row: AutoMovieHumanLegMassPrior.IRow,
        ): { height: number; value: number } => ({
          height: hip + row.share * (knee - hip),
          value: row.front,
        }),
      ),
      ...AutoMovieHumanLegMassPrior.SHANK.map(
        (
          row: AutoMovieHumanLegMassPrior.IRow,
        ): { height: number; value: number } => ({
          height: knee + row.share * (malleolus - knee),
          value: row.front,
        }),
      ),
    ].sort(
      (a: { height: number }, b: { height: number }): number =>
        a.height - b.height,
    );
    const skin: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(
      rows.map((row: { height: number }): number => row.height),
      rows.map((row: { value: number }): number => row.value),
    );
    const frontShare = (height: number): number =>
      AutoMovieNaturalSpline.evaluate(
        skin,
        Math.max(rows[0]!.height, Math.min(rows.at(-1)!.height, height)),
      );

    // The lateral share of the breadth about the bone line: the thigh's from
    // the knee centre toward the crotch, the shank's from the ankle's site to
    // the knee centre.
    const T: typeof AutoMovieHumanReferenceOutlines =
      AutoMovieHumanReferenceOutlines;
    const lateral = (height: number): number =>
      height >= knee
        ? T.at(T.THIGH_SPLIT, "lateral", (height - knee) / (crotch - knee))
        : T.at(T.SHANK_SPLIT, "lateral", (height - ankle) / (knee - ankle));

    // A site's box from its girth: the estimated breadth over depth at the
    // site's share of the ankle-to-crotch span (`AutoMovieHumanLegSectionProportion`,
    // estimated from the private reference set: no published source found).
    const law = (
      height: number,
      girth: number,
    ): AutoMovieHumanLegWalk.ISiteLaw => {
      const span: number = (height - malleolus) / (crotch - malleolus);
      const box: { breadth: number; depth: number } =
        AutoMovieHumanLegSectionProportion.box(girth, span);
      const front: number = frontShare(height);
      const out: number = lateral(height) * box.breadth;
      const inward: number = box.breadth - out;
      const [plus, minus]: [number, number] =
        side === "left" ? [out, inward] : [inward, out];
      return {
        height,
        edges: [box.depth * front, plus, -box.depth * (1 - front), -minus],
        girth,
      };
    };
    const laws: Record<string, AutoMovieHumanLegWalk.ISiteLaw> = {
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
    // Retained four-reference thigh-girth ratios author intermediate shape
    // at their hip-to-knee shares. They are not new public tapes or proof
    // that the old rig/horizontal profile is anatomical on this bone-normal
    // chart. Existing public thigh and lower-thigh sites take precedence.
    const intermediate: string[] = [];
    for (const [share, ratio] of AutoMovieHumanLegGirth.THIGH) {
      const height: number = hip + share * (knee - hip);
      if (!(height < laws.thigh!.height && height > laws.lowerThigh!.height))
        continue;
      const site: string = `shape.thigh.${share}`;
      laws[site] = law(height, ratio * measures.thighCircumference * scale);
      intermediate.push(site);
    }
    const resolve: AutoMovieHumanLegWalk.ILaw = (
      site: string,
    ): AutoMovieHumanLegWalk.ISiteLaw => {
      const found: AutoMovieHumanLegWalk.ISiteLaw | undefined = laws[site];
      if (found === undefined)
        throw new Error(`No leg law at the site ${site}`);
      return found;
    };
    return Object.assign(resolve, { intermediate });
  }
}
