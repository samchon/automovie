import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanBodyBox } from "../AutoMovieHumanBodyBox";
import { AutoMovieHumanTrunkLandmarks } from "../AutoMovieHumanTrunkLandmarks";
import { AutoMovieHumanViewSection } from "../../lofting/AutoMovieHumanViewSection";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/**
 * The trunk base's views from a person's measures: every site's height, half
 * breadth, front and back profile and fullness owner, in calibration
 * millimetres (#3047).
 *
 * Sources, site by site:
 *
 * - Heights: the crotch (the caller's, ISO 8559-1 5.7.6), the buttock point,
 *   the chest point and ISO 8559-1's waist level (midway between the tenth
 *   rib and iliocristale) as ANSUR II shares of the crotch-to-cervicale span
 *   (`AutoMovieHumanTrunkLandmarks`, measured or derived there); the top hip
 *   midway between the waist and the hip (ISO 8559-1 5.3.12); the
 *   inframammary fold two intercostal spaces under the chest point (Gray
 *   1918, `AutoMovieHumanTrunkLandmarks.FOLD_DROP`, conventional); the
 *   axilla, the acromion and cervicale as inputs (ANSUR II).
 * - Boxes: the chest's breadth, the natural waist's breadth and depth, the
 *   hip's breadth and the buttock's depth from #3045 (`AutoMovieHumanBodyBox.of`,
 *   each tape held inside its box's reach). The top hip's and the underbust's
 *   boxes from their girths by the caller's laws (`ILaws.lumbar`, the navel
 *   section's ANSUR 1988 law; `ILaws.chestWall`, the thorax without the
 *   breasts).
 * - Side placement: the back median's forward place at each height from the
 *   caller's back profile law (`ILaws.back`), the front the back plus the
 *   site's base depth.
 *
 * The base is drawn without its protrusions (#3047). At the chest its depth
 * is the chest wall's at the underbust (the breast's amplitude is the chest
 * depth less that depth, so the base takes the remainder). At the buttock its
 * depth is the natural waist's (the gluteal amplitude is the buttock depth
 * less the waist depth) and its back the back profile's median, the sacrum,
 * on which the two gluteal masses stand apart. Those two sites' tapes wrap
 * the merged skin, so their fullness is solved by the trunk's assembly on the
 * hull of the base's and the masses' sections; here they carry the ellipse's
 * shoulder (the least-information conic) to start from. The waist's, the top
 * hip's and the underbust's tapes wrap the base alone and are its owners.
 *
 * Above the chest no breadth or depth is published: the caller's `ILaws.upper`
 * gives each upper site's half breadth and front, its sourced shoulder too.
 */
export namespace AutoMovieHumanTrunkViews {
  /** A breadth and depth of a level, mm. */
  export interface IBox {
    /** Whole breadth. */
    breadth: number;

    /** Whole depth. */
    depth: number;
  }

  /** The laws the views read beyond the published measures, each a pure function of the person in calibration millimetres. */
  export interface ILaws {
    /** The back median's forward place at a height, mm. */
    back(y: number): number;

    /** The navel section's box at a girth (top hip). */
    lumbar(girth: number): IBox;

    /** The thorax's box without the breasts at a girth (the underbust). */
    chestWall(girth: number): IBox;

    /** The perineum's forward place, mm. */
    perineum: number;

    /** The sites above the chest, by rising height: each with its half breadth, front and sourced shoulder; the last the trunk's open top inside the neck. */
    upper: { site: string; y: number; half: number; front: number; shoulder: number }[];
  }

  /**
   * The views.
   *
   * @param measures The person's resolved measures, world mm.
   * @param crotch The crotch's height, calibration mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param laws The laws beyond the measures, in calibration mm.
   * @returns The perineum and the sites by rising height.
   */
  export function of(measures: IAutoMovieHumanBodyMeasures, crotch: number, scale: number, laws: ILaws): IAutoMovieHumanTrunkViews {
    const cervicale: number = measures.cervicaleHeight * scale;
    const at = (share: number): number => AutoMovieHumanTrunkLandmarks.at(crotch, cervicale, share);
    const boxes: Record<AutoMovieHumanBodyBox.Level, AutoMovieHumanBodyBox.IBox> = Object.fromEntries(
      AutoMovieHumanBodyBox.of(measures).map((b: AutoMovieHumanBodyBox.IBox): [AutoMovieHumanBodyBox.Level, AutoMovieHumanBodyBox.IBox] => [b.level, b]),
    ) as Record<AutoMovieHumanBodyBox.Level, AutoMovieHumanBodyBox.IBox>;

    // Heights of the published sites.
    const buttock: number = at(AutoMovieHumanTrunkLandmarks.BUTTOCK);
    const waist: number = at(AutoMovieHumanTrunkLandmarks.WAIST);
    const chest: number = at(AutoMovieHumanTrunkLandmarks.CHEST);
    const fold: number = chest - AutoMovieHumanTrunkLandmarks.FOLD_DROP * (cervicale - crotch);
    const topHip: number = (buttock + waist) / 2;

    // A site from its height, half breadth, base depth and fullness, its
    // back on the back profile.
    const site = (name: string, y: number, half: number, depth: number, fullness: IAutoMovieHumanTrunkViews.ISite["fullness"]): IAutoMovieHumanTrunkViews.ISite => {
      const back: number = laws.back(y);
      return { site: name, y, half, front: back + depth, back, fullness };
    };
    const topHipBox: IBox = laws.lumbar(measures.highHipCircumference * scale);
    const underbust: IBox = laws.chestWall(measures.underbustCircumference * scale);
    const ellipse: { shoulder: number } = { shoulder: AutoMovieHumanViewSection.ELLIPSE };

    return {
      perineum: { y: crotch, x: laws.perineum },
      sites: [
        site("buttock", buttock, (boxes.hip.breadth * scale) / 2, boxes.waist.depth * scale, ellipse),
        site("topHip", topHip, topHipBox.breadth / 2, topHipBox.depth, { girth: measures.highHipCircumference * scale }),
        site("waist", waist, (boxes.waist.breadth * scale) / 2, boxes.waist.depth * scale, { girth: boxes.waist.tape * scale }),
        site("underbust", fold, underbust.breadth / 2, underbust.depth, { girth: measures.underbustCircumference * scale }),
        site("chest", chest, (boxes.chest.breadth * scale) / 2, underbust.depth, ellipse),
        ...laws.upper.map(
          (u: ILaws["upper"][number]): IAutoMovieHumanTrunkViews.ISite => {
            const back: number = laws.back(u.y);
            return { site: u.site, y: u.y, half: u.half, front: u.front, back, fullness: { shoulder: u.shoulder } };
          },
        ),
      ],
    };
  }
}
