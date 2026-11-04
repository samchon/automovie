import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyArmSites } from "./HumanAnatomyArmSites";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type IArm = HumanAnatomyShared.IArm;
const A: typeof HumanAnatomy = HumanAnatomy;
const { SMALL }: typeof HumanAnatomyShared = HumanAnatomyShared;

/**
 * The arm read by sections square to its bones, every 2 mm along the upper arm
 * and the forearm: the upper arm's girth runs down from its belly to the elbow
 * in one run, and the forearm's belly stands in its proximal half. Orders
 * anatomy fixes, with no number of a body.
 */
export namespace HumanAnatomyArmProfile {
  /** Spacing of the sections along the bones, mm. */
  export const STEP: number = 2;

  /** Where the upper arm's run is read, as shares of the humerus from the shoulder centre: below the axillary fold, above the epicondyles. */
  export const UPPER: readonly [number, number] = [0.15, 0.85];

  /** The arm's profile rows. */
  export function rows(name: string, skin: HumanAnatomy.ISkin, side: "left" | "right", sites: IArm): IRow[] {
    const shoulder: V3 = A.joint(skin, `${side}UpperArm`);
    const elbow: V3 = A.joint(skin, `${side}LowerArm`);
    const wrist: V3 = A.joint(skin, `${side}Hand`);
    const mcp: V3 = A.joint(skin, `${side}MiddleProximal`);
    const upper: V3 = A.unit(A.sub(elbow, shoulder));
    const humerus: number = A.dist(shoulder, elbow);
    const region: Uint32Array = HumanAnatomyArmSites.limb(skin, [shoulder, elbow, wrist, mcp]);
    const out: IRow[] = [];

    // The upper arm's girth at sections across the humerus; a section that
    // misses its bone is no girth of this arm and reads NaN.
    const girths: number[] = [];
    for (let s: number = UPPER[0] * humerus; s <= UPPER[1] * humerus; s += STEP) {
      const o: V3 = A.add(shoulder, A.scale(upper, s));
      const c: HumanAnatomy.ICut | null = A.cut(skin, o, upper, o, region);
      girths.push(c === null || !c.contained ? NaN : c.girth);
    }

    // Past its maximum, no section is wider than one above it by more than the
    // small-girth error: the upper arm runs down to the elbow in one run, the
    // deltoid and biceps swelling it once (Gray 1918).
    const peak: number = girths.reduce((best: number, g: number, i: number): number => (g > girths[best]! ? i : best), 0);
    let rise: number = 0;
    let floor: number = girths[peak]!;
    for (let i: number = peak + 1; i < girths.length; i++) {
      rise = Math.max(rise, girths[i]! - floor);
      floor = Math.min(floor, girths[i]!);
    }
    out.push({
      person: name,
      site: `${side} upper arm girth, 0.15 to 0.85 of the humerus: largest rise below its maximum, mm`,
      value: girths.every((g: number): boolean => Number.isFinite(g)) ? rise : NaN,
      low: 0,
      high: SMALL,
      unit: "mm",
    });

    // The forearm's belly, the brachioradialis and the flexors and extensors
    // at their fleshiest, lies in the proximal half; the tendons take the
    // distal half (Gray 1918). Read on the profile cut from the elbow, within
    // the 0.1 to 0.6 of the forearm the tape is sought over.
    const forearm: number = A.dist(elbow, wrist);
    let belly: number = NaN;
    let top: number = -Infinity;
    sites.forearmProfile.forEach((g: number, i: number): void => {
      const share: number = (STEP * i) / forearm;
      if (share >= 0.1 && share <= 0.6 && g > top) {
        top = g;
        belly = share;
      }
    });
    out.push({ person: name, site: `${side} forearm belly: its place from the elbow, share of the forearm`, value: belly, low: 0, high: 0.5, unit: "" });
    return out;
  }
}
