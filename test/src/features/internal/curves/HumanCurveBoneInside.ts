import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * Bones inside their skin where the arm and leg audits do not read them
 * (catalog rule LMK-5): every joint centre of the spine, the neck, the head,
 * the hands and the feet lies inside the section of skin cut through it.
 *
 * Each joint is cut by the plane through it normal to its bone (toward its
 * child joint), through the skin within a reach of the joint, and the
 * section's component enclosing the joint must exist: a joint the skin does
 * not enclose reads its distance outside the nearest section. The spine's
 * joints are cut horizontally through the trunk, the arms left out, as the
 * trunk's tapes are.
 */
export namespace HumanCurveBoneInside {
  /** Joints cut normal to their bone: the joint, its child, and the reach of the skin read about it, mm. */
  export const JOINTS: readonly [string, string, number][] = [
    ["neck", "head", 120],
    ["head", "jaw", 140],
    ...HumanAnatomyShared.SIDES.flatMap((s: "left" | "right"): [string, string, number][] => [
      [`${s}Hand`, `${s}MiddleProximal`, 80],
      [`${s}MiddleProximal`, `${s}MiddleIntermediate`, 40],
      [`${s}ThumbProximal`, `${s}ThumbDistal`, 40],
      [`${s}Midfoot`, `${s}Toe2Proximal`, 100],
      [`${s}HalluxProximal`, `${s}HalluxDistal`, 40],
    ]),
  ];

  /** Spine joints cut horizontally through the trunk. */
  export const SPINE: readonly string[] = ["hips", "spine", "chest"];

  /** The rows of one skin: each joint's distance outside its own section, mm, which must be zero. */
  export function rows(person: string, skin: HumanAnatomy.ISkin): IRow[] {
    const out: IRow[] = [];
    const row: (joint: string, outside: number) => void = (joint: string, outside: number): void => {
      out.push({ person, site: `${joint} joint centre outside its own section of skin, mm (LMK-5)`, value: outside, low: 0, high: 0, unit: "mm" });
    };
    for (const [joint, child, reach] of JOINTS) {
      const p: V3 = A.joint(skin, joint);
      const n: V3 = A.unit(A.sub(A.joint(skin, child), p));
      const c: HumanAnatomy.ICut | null = A.cut(skin, p, n, p, A.near(skin, p, p, reach));
      row(joint, c === null ? NaN : c.outside);
    }
    for (const joint of SPINE) {
      // A trunk cut is picked by the spine's joint line at its height, which passes through the joint, so its `outside` is the joint's.
      const p: V3 = A.joint(skin, joint);
      const c: HumanAnatomy.ICut | null = HumanAnatomyShared.trunkCut(skin, p[1]);
      row(joint, c === null ? NaN : c.outside);
    }
    return out;
  }
}
