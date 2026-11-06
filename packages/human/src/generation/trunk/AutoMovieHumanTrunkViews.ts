import { AutoMovieViewSection } from "@automovie/engine";

import { AutoMovieHumanBodyBox } from "../AutoMovieHumanBodyBox";
import { AutoMovieHumanTrunkLandmarks } from "../AutoMovieHumanTrunkLandmarks";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/**
 * The trunk base's views from a person's measures: every site's height, half
 * breadth, front and back profile and fullness owner, in calibration
 * millimetres (#3047).
 *
 * Sources, site by site:
 *
 * - Heights: the crotch (the caller's, ISO 8559-1 5.7.6), the buttock point
 *   as an ANSUR II share of the crotch-to-cervicale span
 *   (`AutoMovieHumanTrunkLandmarks`, measured there); the chest at the caller's
 *   same generating bust-apex height (currently an old course-placement proxy,
 *   not a second independent survey site); the natural waist at
 *   the person's `waistHeight` (the 1988 Army survey's natural waist, where
 *   its breadth and depth are taken); the top hip
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
 * The base is drawn without its protrusions (#3047): the caller gives each
 * mass's retained wall setback. This fixes the bare median box, not the local
 * amplitude at the mass's transverse place. The actual original wall/AP-apex
 * difference supplies that amplitude in the assembly. At the chest the base's
 * depth is chest depth less the setback (the whole chest depth for a man,
 * whose chest carries none). At the buttock the caller's back line is the
 * gluteal apex (`ILaws.back`, the median section's back extreme), so the
 * base's back stands the gluteal amplitude in front of it and its front the
 * buttock depth, and the two gluteal masses stand on it apart. Those two sites' tapes wrap
 * the merged skin, so their fullness is solved by the trunk's assembly on the
 * hull of the base's and the masses' sections; here they carry the ellipse's
 * shoulder (the least-information conic) to start from. The waist's, the top
 * hip's and the underbust's tapes wrap the base alone and are its owners.
 *
 * Above the chest no breadth or depth is published: the caller's `ILaws.upper`
 * gives each upper site's half breadth, front and back (the back profile's
 * where it gives none), its sourced shoulder too. Where the female axilla
 * table contains the breast envelope, the bare wall instead continues the
 * same chest depth; this is an explicit thorax transfer convention.
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
    /** Shared chest/bust-apex height from the generating placement, calibration mm; the interim caller still transfers its old course solve. */
    chest: number;

    /** The back's forward place at a height, mm: the median section's back extreme, the gluteal apex at the buttock. */
    back(y: number): number;

    /** Retained stations of the same back law. Bare-wall offsets transfer between neighbouring named sites without a new fit. */
    backStations?: readonly { site: string; y: number }[];

    /** The navel section's box at a girth (top hip). */
    lumbar(girth: number): IBox;

    /** The thorax's box without the breasts at a girth (the underbust). */
    chestWall(girth: number): IBox;

    /** The perineum's forward place, mm. */
    perineum: number;

    /** The sites above the chest, by rising height: each with its half breadth, front, back (the back profile's where absent) and sourced shoulder; the last the trunk's open top inside the neck. */
    upper: {
      site: string;
      y: number;
      half: number;
      front: number;
      back?: number;
      shoulder: number;
    }[];
  }

  /**
   * The views.
   *
   * @param measures The person's resolved measures, world mm.
   * @param crotch The crotch's height, calibration mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param laws The laws beyond the measures, in calibration mm.
   * @param amplitudes Retained breast/gluteal wall setbacks, calibration mm; actual local mass projections are separately owned by source wall and AP apex.
   * @returns The perineum and the sites by rising height.
   */
  export function of(
    measures: IAutoMovieHumanBodyMeasures,
    crotch: number,
    scale: number,
    laws: ILaws,
    amplitudes: { breast: number; gluteal: number },
  ): IAutoMovieHumanTrunkViews {
    const cervicale: number = measures.cervicaleHeight * scale;
    const at = (share: number): number =>
      AutoMovieHumanTrunkLandmarks.at(crotch, cervicale, share);
    const boxes: Record<
      AutoMovieHumanBodyBox.Level,
      AutoMovieHumanBodyBox.IBox
    > = Object.fromEntries(
      AutoMovieHumanBodyBox.of(measures).map(
        (
          b: AutoMovieHumanBodyBox.IBox,
        ): [AutoMovieHumanBodyBox.Level, AutoMovieHumanBodyBox.IBox] => [
          b.level,
          b,
        ],
      ),
    ) as Record<AutoMovieHumanBodyBox.Level, AutoMovieHumanBodyBox.IBox>;

    // Heights of the published sites.
    const buttock: number = at(AutoMovieHumanTrunkLandmarks.BUTTOCK);
    const waist: number = measures.waistHeight * scale;
    const chest: number = laws.chest;
    const fold: number =
      chest - AutoMovieHumanTrunkLandmarks.FOLD_DROP * (cervicale - crotch);
    const topHip: number = (buttock + waist) / 2;

    // A site from its height, half breadth, base depth and fullness, its
    // back on the back profile.
    const site = (
      name: string,
      y: number,
      half: number,
      depth: number,
      fullness: IAutoMovieHumanTrunkViews.ISite["fullness"],
    ): IAutoMovieHumanTrunkViews.ISite => {
      const back: number = laws.back(y);
      return { site: name, y, half, front: back + depth, back, fullness };
    };
    const topHipBox: IBox = laws.lumbar(measures.highHipCircumference * scale);
    const underbust: IBox = laws.chestWall(
      measures.underbustCircumference * scale,
    );
    const ellipse: { shoulder: number } = {
      shoulder: AutoMovieViewSection.ELLIPSE,
    };

    const sites: IAutoMovieHumanTrunkViews.ISite[] = [
      {
        ...site(
          "buttock",
          buttock,
          (boxes.hip.breadth * scale) / 2,
          boxes.hip.depth * scale - amplitudes.gluteal,
          ellipse,
        ),
        back: laws.back(buttock) + amplitudes.gluteal,
        front: laws.back(buttock) + measures.buttockDepth * scale,
      },
      site("topHip", topHip, topHipBox.breadth / 2, topHipBox.depth, {
        girth: measures.highHipCircumference * scale,
      }),
      site(
        "waist",
        waist,
        (boxes.waist.breadth * scale) / 2,
        boxes.waist.depth * scale,
        { girth: boxes.waist.tape * scale },
      ),
      site("underbust", fold, underbust.breadth / 2, underbust.depth, {
        girth: measures.underbustCircumference * scale,
      }),
      site(
        "chest",
        chest,
        (boxes.chest.breadth * scale) / 2,
        boxes.chest.depth * scale - amplitudes.breast,
        ellipse,
      ),
      ...laws.upper.map(
        (u: ILaws["upper"][number]): IAutoMovieHumanTrunkViews.ISite => {
          const back: number = u.back ?? laws.back(u.y);

          // The whole-skin table includes the breast envelope. Continue
          // bare chest depth into the axilla attachment rather than
          // counting that envelope as wall again. This constant-depth
          // thorax transfer is a construction convention, not a measurement.
          const front: number =
            u.site === "axilla" && amplitudes.breast > 0
              ? back + boxes.chest.depth * scale - amplitudes.breast
              : u.front;
          return {
            site: u.site,
            y: u.y,
            half: u.half,
            front,
            back,
            fullness: { shoulder: u.shoulder },
          };
        },
      ),
    ];
    const backProfile: NonNullable<IAutoMovieHumanTrunkViews["backProfile"]> =
      [];
    for (const row of laws.backStations ?? []) {
      if (
        !(row.y > sites[0]!.y && row.y < sites.at(-1)!.y) ||
        sites.some(
          (s: IAutoMovieHumanTrunkViews.ISite): boolean => s.y === row.y,
        )
      )
        continue;
      const right: number = sites.findIndex(
        (s: IAutoMovieHumanTrunkViews.ISite): boolean => s.y > row.y,
      );
      const a: IAutoMovieHumanTrunkViews.ISite = sites[right - 1]!;
      const b: IAutoMovieHumanTrunkViews.ISite = sites[right]!;
      const share: number = (row.y - a.y) / (b.y - a.y);
      const offset: number =
        (1 - share) * (a.back - laws.back(a.y)) +
        share * (b.back - laws.back(b.y));
      backProfile.push({
        site: row.site,
        y: row.y,
        back: laws.back(row.y) + offset,
      });
    }
    return {
      perineum: { y: crotch, x: laws.perineum },
      sites,
      backProfile,
    };
  }
}
