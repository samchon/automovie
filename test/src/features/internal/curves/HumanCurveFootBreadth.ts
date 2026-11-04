import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import type { HumanAnatomyFoot } from "../HumanAnatomyFoot";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanCurveProfile } from "./HumanCurveProfile";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * The foot's breadth along its axis (catalog rule PRO-FT-4): the skin of one
 * foot cut by planes across its axis every 2.5 percent of its length, each
 * section's extent across the axis read as the breadth there.
 *
 * The foot is widest across the metatarsal heads, the site of the foot
 * breadth (ANSUR II, ISO 8559-1); the first head stands at 0.739 (women) and
 * 0.741 (men) of foot length (ANSUR II ball-of-foot length) and the fifth
 * behind it on the oblique metatarsal line, so the widest section lies within
 * 0.6 to 0.8 of the length. From the heel the breadth widens to it and past
 * it narrows to the toes (Gray 1918: the heel is narrow, the forefoot spread
 * over the heads), each run monotone within the foot's ISO 20685-1 error,
 * 2 mm (`HumanAnatomyShared.FOOT`).
 */
export namespace HumanCurveFootBreadth {
  /** Spacing of the sections, share of foot length. */
  export const STEP: number = 0.025;

  /** Where the widest section may lie, shares of foot length. */
  export const WIDEST: readonly [number, number] = [0.6, 0.8];

  /** A foot's breadth by section. */
  export interface IProfile {
    /** Share of foot length of each section. */
    share: number[];

    /** Extent of each section across the axis, mm; NaN where the section is empty. */
    breadth: number[];
  }

  /** The breadth profile of one foot. */
  export function profile(skin: HumanAnatomy.ISkin, side: "left" | "right", f: HumanAnatomyFoot.IFoot): IProfile {
    const tris: Uint32Array = A.triangles(skin, new RegExp(`^(foot|forefoot|toe)\\.${side}`));
    const across: V3 = [-f.axis[2], 0, f.axis[0]];
    const out: IProfile = { share: [], breadth: [] };
    for (let s: number = STEP; s < 1 - 1e-9; s += STEP) {
      const origin: V3 = A.add(f.rear, A.scale(f.axis, s * f.length));
      const w: number[] = A.polylines(skin, origin, f.axis, tris).flatMap((l: { points: V3[] }): V3[] => l.points).map((q: V3): number => A.dot(q, across));
      out.share.push(s);
      out.breadth.push(w.length === 0 ? NaN : Math.max(...w) - Math.min(...w));
    }
    return out;
  }

  /** The breadth rows of one foot's profile. */
  export function rows(person: string, side: "left" | "right", p: IProfile): IRow[] {
    const b: number[] = p.breadth;
    if (b.some((v: number): boolean => !Number.isFinite(v)))
      return [{ person, site: `${side} foot breadth profile: a section across the foot is empty (PRO-FT-4)`, value: NaN, low: 0, high: 0, unit: "mm" }];
    const widest: number = HumanCurveProfile.argmax(b, 0, b.length - 1);
    return [
      { person, site: `${side} foot breadth profile: share of foot length of the widest section, ${b[widest]!.toFixed(1)} mm (PRO-FT-4)`, value: p.share[widest]!, low: WIDEST[0], high: WIDEST[1], unit: "" },
      { person, site: `${side} foot breadth profile: excess variation of the widening from the heel to the widest section, mm (PRO-FT-4)`, value: HumanCurveProfile.excess(b.slice(0, widest + 1)), low: 0, high: HumanAnatomyShared.FOOT, unit: "mm" },
      { person, site: `${side} foot breadth profile: excess variation of the narrowing from the widest section to the toes, mm (PRO-FT-4)`, value: HumanCurveProfile.excess(b.slice(widest)), low: 0, high: HumanAnatomyShared.FOOT, unit: "mm" },
    ];
  }
}
