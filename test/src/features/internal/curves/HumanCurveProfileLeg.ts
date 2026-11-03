import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { AutoMovieHumanSkeletonLaw } from "../../../../../packages/human/src/generation/AutoMovieHumanSkeletonLaw";
import type { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanCurveProfile } from "./HumanCurveProfile";
import { HumanCurveRings } from "./HumanCurveRings";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const P: typeof HumanCurveProfile = HumanCurveProfile;
const { SMALL, LARGE } = HumanAnatomyShared;

/**
 * The leg's girth profile on its composed chain, crotch ring to ankle ring,
 * read against the person's intrinsic leg profile
 * (`packages/human/docs/testing/consistency.md`, section 3.1): the thigh
 * wider than the knee, the calf one belly, the fall from the calf to the
 * least ankle monotone with at most one inflection, the least ankle in its
 * human ratio to the calf.
 *
 * Sites are found on the profile by the landmarks that define them: the
 * crotch is the chain's top ring, the knee and ankle levels are the bind
 * skeleton's joint centres (the knee centre stands at the femoral
 * epicondyles), and the thigh, calf and least ankle are the profile's own
 * extremes in the windows anatomy gives them. Heights are the section
 * centres' heights, so a framed leg is read by where its sections stand.
 */
export namespace HumanCurveProfileLeg {
  /**
   * ANSUR II least ankle over calf girth, the ratio of means 0.578 (women)
   * and 0.585 (men) less and plus 2.326 SD, each SD from the two girths'
   * coefficients of variation taken as uncorrelated (the leg audit's band).
   */
  export const ANKLE_OVER_CALF: readonly [number, number] = [0.439, 0.719];

  /** ANSUR 1988 thigh over hip girth, each sex's mean plus and minus 3 SD, the union (`HumanPopulationAudit.RELATIONS`). */
  export const THIGH_OVER_HIP: readonly [number, number] = [0.54, 0.666];

  /** Where the calf's belly is sought, as shares of the shank below the knee centre (the leg audit's window). */
  export const CALF: readonly [number, number] = [0.15, 0.6];

  /** Where the least ankle girth may lie, as shares of the shank below the knee centre: above the malleoli. */
  export const ANKLE: readonly [number, number] = [0.75, 0.97];

  /** The inflection window, as a share of the shank: features narrower than a tenth of the segment are the noise floor's. */
  export const WINDOW: number = 0.1;

  /** Where a leg's sites fall on its profile, as sample indices, and the heights they are read from. */
  export interface ISites {
    /** Index of the thigh's widest section under the crotch. */
    thigh: number;

    /** Index of the knee's widest section within 20 mm below the knee centre (mid-patella). */
    knee: number;

    /** Index of the least girth between the knee and the calf (the infrapatellar waist). */
    infrapatellar: number;

    /** Index of the calf's belly. */
    calf: number;

    /** Index of the least ankle girth below the calf. */
    ankle: number;

    /** Knee centre height, input mm. */
    kneeY: number;

    /** Shank length: knee centre height less ankle centre height, input mm. */
    shank: number;
  }

  /**
   * The leg rows of one person's composed chains, both sides.
   *
   * @param person Name in the rows.
   * @param body The person's delivered body.
   * @param stature The stature input, mm.
   * @param k Input millimetres per calibration millimetre.
   * @param read A side's profile: the cached one for a person, an uncached one for a made defect.
   */
  export function rows(
    person: string,
    body: IAutoMovieHumanBodyCalibration,
    stature: number,
    k: number,
    read: (chain: string) => HumanCurveRings.IProfile,
  ): IRow[] {
    const out: IRow[] = [];
    for (const side of HumanAnatomyShared.SIDES) {
      const profile: HumanCurveRings.IProfile = read(`leg.${side}`);
      const g: number[] = profile.girth;
      const s: ISites = sites(profile, body, side, stature, k);
      const span: (from: number, to: number) => number[] = (from: number, to: number): number[] => g.slice(Math.min(from, to), Math.max(from, to) + 1);
      const row: (site: string, value: number, low: number, high: number, unit: string) => void = (site: string, value: number, low: number, high: number, unit: string): void => {
        out.push({ person, site: `leg.${side} composed chain: ${site}`, value, low, high, unit });
      };

      // ORD-LG-1: the thigh outgirths the knee in every adult (ANSUR 1988
      // knee over thigh 0.631, SD 0.029; its 3 SD top is 0.718).
      row("thigh girth over knee girth, mm (ORD-LG-1)", g[s.thigh]! - g[s.knee]!, Number.MIN_VALUE, Infinity, "mm");

      // ORD-LG-2: the least ankle against the calf.
      row("least ankle girth / calf girth (ORD-LG-2)", g[s.ankle]! / g[s.calf]!, ANKLE_OVER_CALF[0], ANKLE_OVER_CALF[1], "");

      // PRO-LG-6: the least ankle stands just above the malleoli.
      row("least ankle's depth below the knee centre, share of the shank (PRO-LG-6)", (s.kneeY - profile.centre[s.ankle]![1]) / s.shank, ANKLE[0], ANKLE[1], "");

      // PRO-LG-5: the calf falls to the least ankle as one monotone run with
      // at most one inflection, at the gastrocnemius' musculotendinous
      // junction (Gray 1918); a wobble of amplitude a reads 2a of excess.
      const fall: number[] = span(s.ankle, s.calf);
      row("calf to least ankle: excess variation, mm (PRO-LG-5)", P.excess(fall), 0, SMALL, "mm");
      row(
        "calf to least ankle: inflections over a tenth of the shank (PRO-LG-5)",
        P.inflections(fall, HumanCurveRings.STEP, WINDOW * s.shank, SMALL),
        0,
        1,
        "inflections",
      );

      // PRO-LG-4: the shank rises from its infrapatellar waist to one calf belly.
      row("infrapatellar waist to calf: excess variation, mm (PRO-LG-4)", P.excess(span(s.calf, s.infrapatellar)), 0, SMALL, "mm");

      // PRO-LG-2 and PRO-LG-3: from the knee up to the thigh's widest the
      // girth only rises, but for at most one waist above the patella; no
      // ring bulges out of the thigh's taper.
      const thigh: HumanCurveProfile.ITurn[] = P.turns(span(s.knee, s.thigh), SMALL);
      row("knee to thigh: interior maxima beyond a small-girth error (PRO-LG-2)", thigh.filter((t: HumanCurveProfile.ITurn): boolean => t.kind === "max").length, 0, 0, "turns");
      row("knee to thigh: interior minima beyond a small-girth error (PRO-LG-3)", thigh.filter((t: HumanCurveProfile.ITurn): boolean => t.kind === "min").length, 0, 1, "turns");

      // PRO-LG-1: from the thigh's widest up to the crotch ring the girth
      // holds or grows into the crotch's split, within the large-girth error.
      row("thigh's widest to the crotch ring: excess variation, mm (PRO-LG-1)", P.excess(span(s.thigh, g.length - 1)), 0, LARGE, "mm");

      // ORD-LG-4: the thigh against the hip, the trunk's widest girth from the
      // crotch ring to 0.62 S (the buttocks' level and the hips below the
      // natural waist): ANSUR 1988 thigh over hip 0.600 (SD 0.020) women and
      // 0.606 (SD 0.020) men, 3 SD either side, 0.540 to 0.666.
      const trunk: HumanCurveRings.IProfile = read("trunk");
      let hip: number = 0;
      trunk.stations.forEach((y: number, i: number): void => {
        if (y <= 0.62 * stature) hip = Math.max(hip, trunk.girth[i]!);
      });
      row("thigh girth over the hip's girth (ORD-LG-4)", g[s.thigh]! / hip, THIGH_OVER_HIP[0], THIGH_OVER_HIP[1], "");
    }
    return out;
  }

  /**
   * Locate a leg's sites on its profile.
   *
   * @throws {Error} When the body carries no bind skeleton, so no knee or ankle level exists.
   */
  export function sites(profile: HumanCurveRings.IProfile, body: IAutoMovieHumanBodyCalibration, side: "left" | "right", stature: number, k: number): ISites {
    const joint: (bone: string) => V3 = (bone: string): V3 => {
      const b: AutoMovieHumanSkeletonLaw.IBone | undefined = body.skeleton?.find((x: AutoMovieHumanSkeletonLaw.IBone): boolean => x.bone === bone);
      if (b === undefined) throw new Error(`the body has no ${bone} joint`);
      return [b.position[0]! * k, b.position[1]! * k, b.position[2]! * k];
    };
    const kneeY: number = joint(`${side}LowerLeg`)[1];
    const ankleY: number = joint(`${side}Foot`)[1];
    const shank: number = kneeY - ankleY;
    const y: number[] = profile.centre.map((c: V3): number => c[1]);
    const crotch: number = y[y.length - 1]!;

    // The indices whose section centre stands within a height band.
    const within: (lo: number, hi: number) => [number, number] = (lo: number, hi: number): [number, number] => {
      let from: number = -1;
      let to: number = -1;
      y.forEach((h: number, i: number): void => {
        if (h >= lo && h <= hi) {
          if (from < 0) from = i;
          to = i;
        }
      });
      return [from, to];
    };

    // ISO 8559-1 5.3.20 reads the thigh's widest just below the gluteal fold:
    // from 10 mm under the crotch down a tenth of stature, as the leg audit.
    const thigh: number = P.argmax(profile.girth, ...within(crotch - 0.1 * stature, crotch - 10));
    const knee: number = P.argmax(profile.girth, ...within(kneeY - 20, kneeY));
    const calf: number = P.argmax(profile.girth, ...within(kneeY - CALF[1] * shank, kneeY - CALF[0] * shank));
    const infrapatellar: number = P.argmin(profile.girth, calf, knee);
    const ankle: number = P.argmin(profile.girth, 0, calf);
    return { thigh, knee, infrapatellar, calf, ankle, kneeY, shank };
  }
}
