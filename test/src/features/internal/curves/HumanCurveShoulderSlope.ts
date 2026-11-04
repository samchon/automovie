import type { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import type { HumanAnatomyCourse } from "../HumanAnatomyCourse";
import { HumanAnatomyShared } from "../HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;

/**
 * The shoulder's slope on the skin (catalog rule PRO-SH-2): the line from
 * the side neck point to the shoulder point, both located on the skin by the
 * course observer's ISO 8559-1 definitions, falls below the horizontal in
 * the frontal plane by the angle people have.
 *
 * FAA 1965 measured 22.5 degrees below horizontal (67.5 from the vertical,
 * SD 5.0) on 55 men; Japanese surveys of women read 20 to 24 degrees
 * (`faa-1965-shoulder-slope.md`). The band is the men's mean plus and minus
 * 2.326 SD, 10.9 to 34.1 degrees, which holds the women's means.
 */
export namespace HumanCurveShoulderSlope {
  /** Least and largest slope below horizontal, degrees. */
  export const BAND: readonly [number, number] = [22.5 - 2.326 * 5, 22.5 + 2.326 * 5];

  /** The slope rows of one skin's course sites, both sides. */
  export function rows(person: string, k: HumanAnatomyCourse.ICourse): IRow[] {
    return HumanAnatomyShared.SIDES.map((side: "left" | "right"): IRow => {
      const neck: V3 | null = k.sideNeck[side];
      const shoulder: V3 | null = k.shoulder[side];
      const angle: number =
        neck === null || shoulder === null ? NaN : (Math.atan2(neck[1] - shoulder[1], Math.abs(shoulder[2] - neck[2])) * 180) / Math.PI;
      return { person, site: `${side} shoulder slope, side neck point to shoulder point below horizontal, deg (PRO-SH-2)`, value: angle, low: BAND[0], high: BAND[1], unit: "deg" };
    });
  }
}
