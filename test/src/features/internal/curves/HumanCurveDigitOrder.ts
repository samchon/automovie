import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import type { HumanCurveKinematics } from "./HumanCurveKinematics";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type Joints = HumanCurveKinematics.Joints;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * The order of the hands' and feet's joints at the anatomical neutral
 * (catalog rules LMK-7, LMK-8, ORD-HN-4, ORD-FT-2), read on the pose
 * evaluator's joint centres along each part's own axis:
 *
 * - LMK-8: along the hand's axis (wrist centre to the third knuckle) every
 *   finger's MCP, PIP and DIP joints follow one another distally, the fingers
 *   being straight at the neutral;
 * - ORD-HN-4: the knuckles arc, the third standing most distal, then the
 *   second, the fourth and the fifth (Bridgman 1920);
 * - LMK-7: along the foot's axis (ankle centre to the second toe's MTP) the
 *   ankle, the midfoot, each toe's MTP and its distal joint follow one
 *   another forward;
 * - ORD-FT-2: the longest toe is the first or the second, and the third,
 *   fourth and fifth end successively nearer the heel.
 *
 * Every gap must exceed the ISO 20685-1 error of its part's dimensions (1 mm
 * for the hand, 2 mm for the foot), so an order the tapes cannot resolve is
 * not read as one.
 */
export namespace HumanCurveDigitOrder {
  /** The four fingers, radial to ulnar, by their rig names. */
  export const FINGERS: readonly string[] = ["Index", "Middle", "Ring", "Little"];

  /** The lesser toes by their rig names. */
  export const TOES: readonly string[] = ["Toe2", "Toe3", "Toe4", "Toe5"];

  /** The rows of one person's neutral joints. */
  export function rows(person: string, j: Joints): IRow[] {
    const out: IRow[] = [];
    const at: (bone: string) => V3 = (bone: string): V3 => {
      const p: V3 | undefined = j.get(bone);
      if (p === undefined) throw new Error(`no ${bone} joint`);
      return p;
    };
    const ahead: (site: string, value: number, gap: number) => void = (site: string, value: number, gap: number): void => {
      out.push({ person, site, value, low: gap, high: Infinity, unit: "mm" });
    };

    for (const side of HumanAnatomyShared.SIDES) {
      // The hand's axis and each joint's place along it.
      const wrist: V3 = at(`${side}Hand`);
      const hand: V3 = A.unit(A.sub(at(`${side}MiddleProximal`), wrist));
      const s: (bone: string) => number = (bone: string): number => A.dot(A.sub(at(bone), wrist), hand);
      for (const f of FINGERS) {
        ahead(`${side} ${f.toLowerCase()} finger: PIP distal of MCP along the hand, mm (LMK-8)`, s(`${side}${f}Intermediate`) - s(`${side}${f}Proximal`), HumanAnatomyShared.HAND);
        ahead(`${side} ${f.toLowerCase()} finger: DIP distal of PIP along the hand, mm (LMK-8)`, s(`${side}${f}Distal`) - s(`${side}${f}Intermediate`), HumanAnatomyShared.HAND);
      }
      ahead(`${side} knuckles: MCP3 distal of MCP2, mm (ORD-HN-4)`, s(`${side}MiddleProximal`) - s(`${side}IndexProximal`), Number.MIN_VALUE);
      ahead(`${side} knuckles: MCP2 distal of MCP4, mm (ORD-HN-4)`, s(`${side}IndexProximal`) - s(`${side}RingProximal`), Number.MIN_VALUE);
      ahead(`${side} knuckles: MCP4 distal of MCP5, mm (ORD-HN-4)`, s(`${side}RingProximal`) - s(`${side}LittleProximal`), Number.MIN_VALUE);

      // The foot's axis and each joint's place along it.
      const ankle: V3 = at(`${side}Foot`);
      const foot: V3 = A.unit(A.reject(A.sub(at(`${side}Toe2Proximal`), ankle), [0, 1, 0]));
      const f: (bone: string) => number = (bone: string): number => A.dot(A.sub(at(bone), ankle), foot);
      ahead(`${side} foot: midfoot ahead of the ankle, mm (LMK-7)`, f(`${side}Midfoot`), HumanAnatomyShared.FOOT);
      ahead(`${side} foot: hallux MTP ahead of the midfoot, mm (LMK-7)`, f(`${side}HalluxProximal`) - f(`${side}Midfoot`), HumanAnatomyShared.FOOT);
      ahead(`${side} foot: hallux tip joint ahead of its MTP, mm (LMK-7)`, f(`${side}HalluxDistal`) - f(`${side}HalluxProximal`), HumanAnatomyShared.FOOT);
      for (const t of TOES) ahead(`${side} ${t.toLowerCase()}: distal joint ahead of its MTP, mm (LMK-7)`, f(`${side}${t}Distal`) - f(`${side}${t}Proximal`), HumanAnatomyShared.FOOT);

      // ORD-FT-2: the longest toe is the first or the second; the rest step back.
      const tips: number[] = [f(`${side}HalluxDistal`), ...TOES.map((t: string): number => f(`${side}${t}Distal`))];
      ahead(`${side} foot: first or second toe the longest, over the third, mm (ORD-FT-2)`, Math.max(tips[0]!, tips[1]!) - Math.max(...tips.slice(2)), Number.MIN_VALUE);
      ahead(`${side} foot: third toe ahead of the fourth, mm (ORD-FT-2)`, tips[2]! - tips[3]!, Number.MIN_VALUE);
      ahead(`${side} foot: fourth toe ahead of the fifth, mm (ORD-FT-2)`, tips[3]! - tips[4]!, Number.MIN_VALUE);
    }
    return out;
  }
}
