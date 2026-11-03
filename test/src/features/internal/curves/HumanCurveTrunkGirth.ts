import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanCurveProfile } from "./HumanCurveProfile";
import type { HumanCurveRings } from "./HumanCurveRings";

type IRow = HumanAnatomyAudit.IRow;

/**
 * The composed trunk chain's girth between its sites (catalog rules PRO-TR-2
 * and PRO-TR-4): from the chest's greatest girth the trunk falls to the
 * natural waist without a roll, and from the waist it widens to the hips.
 *
 * The natural waist is by definition the least girth between the lowest rib
 * and the iliac crest, so it is the least girth of the trunk chain within
 * 0.56 S to 0.70 S (the band holding ANSUR II's iliocristale and tenth rib
 * heights); the chest is the greatest girth above it, the hips the greatest
 * below it. Each span is read for its excess variation, which a monotone run
 * reads as zero and a roll of amplitude a as 2a, against ISO 20685-1:2018
 * Table 4's 9 mm for large girths (`HumanAnatomyShared.LARGE`).
 *
 * A person whose own high hip input stands above the line from the waist to
 * the hip input by more than that error carries central adiposity (WHO 2008
 * on the waist and hip; the high hip lies midway between them, ISO 8559-1
 * 5.3.12), so the abdomen may rise to a maximum before the hips: the span is
 * then read for its interior turns beyond the 9 mm floor, at most one
 * maximum and its following minimum.
 */
export namespace HumanCurveTrunkGirth {
  /** The natural waist's band, shares of stature. */
  export const WAIST: readonly [number, number] = [0.56, 0.7];

  /** The sites found on a trunk profile, as indices into its stations. */
  export interface ISites {
    /** The least girth within {@link WAIST}. */
    waist: number;

    /** The greatest girth above the waist. */
    chest: number;

    /** The greatest girth below the waist. */
    hip: number;
  }

  /** The sites of a trunk profile whose stations are heights, input mm. */
  export function sites(trunk: HumanCurveRings.IProfile, stature: number): ISites {
    const y: number[] = trunk.stations;
    const g: number[] = trunk.girth;
    let waist: number = -1;
    y.forEach((h: number, i: number): void => {
      if (h >= WAIST[0] * stature && h <= WAIST[1] * stature && (waist < 0 || g[i]! < g[waist]!)) waist = i;
    });
    if (waist < 0) throw new Error(`the trunk chain has no station within ${WAIST[0]} S to ${WAIST[1]} S`);
    return { waist, chest: HumanCurveProfile.argmax(g, waist, g.length - 1), hip: HumanCurveProfile.argmax(g, 0, waist) };
  }

  /**
   * The span rows of one person.
   *
   * @param person Name in the rows.
   * @param trunk The `trunk` chain's girth profile; its stations are heights, input mm.
   * @param stature The stature input, mm.
   * @param central Whether the person's own high hip stands above the waist-to-hip line by more than 9 mm.
   */
  export function rows(person: string, trunk: HumanCurveRings.IProfile, stature: number, central: boolean): IRow[] {
    const s: ISites = sites(trunk, stature);
    const g: number[] = trunk.girth;
    const at: (i: number) => string = (i: number): string => `${trunk.stations[i]!.toFixed(0)} mm`;
    const out: IRow[] = [
      {
        person,
        site: `trunk girth from the chest's greatest (${at(s.chest)}) down to the natural waist (${at(s.waist)}): excess variation, mm (PRO-TR-2)`,
        value: HumanCurveProfile.excess(g.slice(s.waist, s.chest + 1)),
        low: 0,
        high: HumanAnatomyShared.LARGE,
        unit: "mm",
      },
    ];
    const rise: number[] = g.slice(s.hip, s.waist + 1);
    if (!central)
      out.push({ person, site: `trunk girth from the hips' greatest (${at(s.hip)}) up to the natural waist (${at(s.waist)}): excess variation, mm (PRO-TR-4)`, value: HumanCurveProfile.excess(rise), low: 0, high: HumanAnatomyShared.LARGE, unit: "mm" });
    else
      out.push({ person, site: `trunk girth from the hips' greatest (${at(s.hip)}) up to the natural waist (${at(s.waist)}), central adiposity: interior turns beyond 9 mm (PRO-TR-4)`, value: HumanCurveProfile.turns(rise, HumanAnatomyShared.LARGE).length, low: 0, high: 2, unit: "turns" });
    return out;
  }

  /** Whether a person's own high hip input stands above the line from its waist to its hip input by more than the large-girth error. */
  export function central(waist: number, highHip: number, hip: number): boolean {
    return highHip > (waist + hip) / 2 + HumanAnatomyShared.LARGE;
  }
}
