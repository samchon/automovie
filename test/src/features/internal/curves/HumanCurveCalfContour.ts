import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanCurveProfile } from "./HumanCurveProfile";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * The calf's frontal contours (catalog rule OBS-LG-1): seen from the front,
 * the inner contour of each shank bulges lower than the outer.
 *
 * The gastrocnemius' medial head is the larger, its fibres "thicker and
 * extending lower than those of the lateral", and "the medial border is the
 * more prominent" (Gray 1918, `packages/human/docs/sources/gray-1918.md`),
 * so the medial contour's greatest reach from the shank's axis stands below
 * the lateral contour's. The shank's skin is cut every 2 mm of height from a
 * tenth to 0.6 of the way from the knee joint to the ankle joint, the calf's
 * span (catalog section 3.1: the calf within 0.15 to 0.6 of the shank), and
 * each section's medial and lateral reach is read across the body from the
 * axis at that height.
 */
export namespace HumanCurveCalfContour {
  /** Height step of the sections, mm. */
  export const STEP: number = 2;

  /** The span read, shares of the knee-to-ankle joint distance below the knee. */
  export const SPAN: readonly [number, number] = [0.1, 0.6];

  /** One shank's two contours, top to bottom. */
  export interface IContours {
    /** Height of each section, mm. */
    height: number[];

    /** Greatest reach of each section toward the midline, mm; NaN where empty. */
    medial: number[];

    /** Greatest reach of each section away from the midline, mm; NaN where empty. */
    lateral: number[];
  }

  /** One shank's contours on a standing skin. */
  export function contours(skin: HumanAnatomy.ISkin, side: "left" | "right"): IContours {
    const knee: V3 = A.joint(skin, `${side}LowerLeg`);
    const ankle: V3 = A.joint(skin, `${side}Foot`);
    const tris: Uint32Array = A.triangles(skin, new RegExp(`^leg\\.${side}$`));

    // The body's left is +Z, so the left shank's lateral side is +Z and the right's -Z.
    const out: IContours = { height: [], medial: [], lateral: [] };
    const outward: number = side === "left" ? 1 : -1;
    const top: number = knee[1] - SPAN[0] * (knee[1] - ankle[1]);
    const bottom: number = knee[1] - SPAN[1] * (knee[1] - ankle[1]);
    for (let y: number = top; y >= bottom; y -= STEP) {
      const axis: V3 = A.lerp(knee, ankle, (knee[1] - y) / (knee[1] - ankle[1]));
      const across: number[] = A.polylines(skin, [0, y, 0], [0, 1, 0], tris)
        .flatMap((l: { points: V3[] }): V3[] => l.points)
        .map((q: V3): number => outward * (q[2] - axis[2]));
      out.height.push(y);
      out.lateral.push(across.length === 0 ? NaN : Math.max(...across));
      out.medial.push(across.length === 0 ? NaN : -Math.min(...across));
    }
    return out;
  }

  /** The row of one shank: the lateral contour's greatest reach stands above the medial's. */
  export function row(person: string, side: "left" | "right", c: IContours): IRow {
    const lateral: number = HumanCurveProfile.argmax(c.lateral, 0, c.lateral.length - 1);
    const medial: number = HumanCurveProfile.argmax(c.medial, 0, c.medial.length - 1);
    const finite: boolean = c.lateral.every(Number.isFinite) && c.medial.every(Number.isFinite) && lateral >= 0 && medial >= 0;
    return {
      person,
      site: `${side} calf: height of the lateral contour's greatest reach (${finite ? c.height[lateral]!.toFixed(0) : "none"} mm) over the medial's (${finite ? c.height[medial]!.toFixed(0) : "none"} mm), mm (OBS-LG-1)`,
      value: finite ? c.height[lateral]! - c.height[medial]! : NaN,
      low: Number.MIN_VALUE,
      high: Infinity,
      unit: "mm",
    };
  }
}
