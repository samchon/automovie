import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import type { HumanAnatomyLegSites } from "./HumanAnatomyLegSites";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ILevels = HumanAnatomyLegSites.ILevels;
type ILeg = HumanAnatomyShared.ILeg;
const A: typeof HumanAnatomy = HumanAnatomy;
const { SMALL, band }: typeof HumanAnatomyShared = HumanAnatomyShared;

/**
 * The leg read by sections square to the vertical, every 2 mm from the crotch
 * to the lateral malleolus: how its girth runs down the thigh, where its least
 * girth stands against the malleolus, and the order of its heights and of its
 * girths. The expectations are orders anatomy fixes, not numbers of a body.
 */
export namespace HumanAnatomyLegProfile {
  /** Spacing of the sections down the leg, mm. */
  export const STEP: number = 2;

  /** The inputs a leg's profile rows read besides its skin. */
  export interface IInputs {
    /** Lateral malleolus height, mm; absent when the person declares no foot. */
    ankleHeight: number | undefined;

    /** Knee girth tape, mm; null when unknown. */
    knee: number | null;

    /** Calf girth tape, mm; null when unknown. */
    calf: number | null;
  }

  /** The leg's rows. */
  export function rows(
    name: string,
    skin: HumanAnatomy.ISkin,
    side: "left" | "right",
    levels: ILevels,
    sites: ILeg,
    inputs: IInputs,
  ): IRow[] {
    const ankleHeight: number | undefined = inputs.ankleHeight;
    const hip: V3 = A.joint(skin, `${side}UpperLeg`);
    const knee: V3 = A.joint(skin, `${side}LowerLeg`);
    const ankle: V3 = A.joint(skin, `${side}Foot`);
    const out: IRow[] = [];

    // The bone axis through a height: the thigh's above the knee, the shank's below.
    const axisAt: (y: number) => V3 = (y: number): V3 =>
      y >= knee[1] ? A.lerp(hip, knee, (hip[1] - y) / (hip[1] - knee[1])) : A.lerp(knee, ankle, (knee[1] - y) / (knee[1] - ankle[1]));
    const girth: (y: number) => number = (y: number): number => {
      const c: HumanAnatomy.ICut | null = A.cut(skin, [0, y, 0], [0, 1, 0], axisAt(y), band(skin, y - 1, y + 1));
      return c === null || !c.contained ? NaN : c.girth;
    };

    // The thigh runs down from its widest section just below the crotch to
    // the knee, and no section is wider than one above it by more than the
    // small-girth error: one run down, no second belly (Gray 1918; the
    // vastus medialis swells only the knee's own inner side).
    const top: number = levels.crotch - 10;
    const bottom: number = knee[1] + 60;
    const thigh: number[] = [];
    for (let y: number = top; y >= bottom; y -= STEP) thigh.push(girth(y));
    const peak: number = thigh.reduce((best: number, g: number, i: number): number => (g > thigh[best]! ? i : best), 0);
    let rise: number = 0;
    let floor: number = thigh[peak]!;
    for (let i: number = peak + 1; i < thigh.length; i++) {
      rise = Math.max(rise, thigh[i]! - floor);
      floor = Math.min(floor, thigh[i]!);
    }
    out.push({
      person: name,
      site: `${side} thigh girth, crotch to 60 mm above the knee: largest rise below its maximum, mm`,
      value: thigh.every((g: number): boolean => Number.isFinite(g)) ? rise : NaN,
      low: 0,
      high: SMALL,
      unit: "mm",
    });

    // The heights stand in the order of the body: hip joint over crotch over
    // knee over ankle over the floor.
    const gaps: number[] = [hip[1] - levels.crotch, levels.crotch - knee[1], knee[1] - ankle[1], ankle[1]];
    out.push({ person: name, site: `${side} leg: least gap in the height order hip joint, crotch, knee, ankle, floor, mm`, value: Math.min(...gaps), low: 0, high: Infinity, unit: "mm" });

    // Girths in their anatomical order: the thigh outgirths the knee and the
    // calf, each outgirths the ankle (ANSUR II means: thigh 616 / 625, calf
    // 373 / 392, ankle 216 / 229 mm, women / men).
    const ankleLeast: number = sites.shankProfile[sites.shankProfile.length - 1]!;
    const orders: [string, number][] = [
      ["thigh over knee", sites.thigh - sites.knee],
      ["thigh over calf", sites.thigh - sites.calf],
      ["knee over least ankle", sites.knee - ankleLeast],
      ["calf over least ankle", sites.calf - ankleLeast],
    ];
    for (const [label, margin] of orders)
      out.push({ person: name, site: `${side} leg girths: ${label}, margin, mm`, value: margin, low: 0, high: Infinity, unit: "mm" });

    // Knee against calf is no order of anatomy (calf over knee 0.966, SD 0.041
    // in ANSUR 1988), so the skin keeps the order of the person's own two
    // tapes where they differ by more than a small-girth error.
    if (inputs.knee !== null && inputs.calf !== null && Math.abs(inputs.knee - inputs.calf) > SMALL)
      out.push({
        person: name,
        site: `${side} leg: knee and calf keep the order of their inputs, skin difference signed by the inputs, mm`,
        value: Math.sign(inputs.knee - inputs.calf) * (sites.knee - sites.calf),
        low: 0,
        high: Infinity,
        unit: "mm",
      });

    // The least ankle girth lies above the malleoli (the identity's own
    // definition of the ankle circumference): scanned down to the lateral
    // malleolus' height, its minimum stands clear of that last section.
    if (ankleHeight !== undefined) {
      let least: number = Infinity;
      let at: number = NaN;
      for (let y: number = knee[1]; y >= ankleHeight; y -= STEP) {
        const g: number = girth(y);
        if (Number.isFinite(g) && g < least) {
          least = g;
          at = y;
        }
      }
      out.push({
        person: name,
        site: `${side} leg: least girth above the lateral malleolus, its height over the malleolus' height, mm`,
        value: at - ankleHeight,
        low: 2 * STEP,
        high: Infinity,
        unit: "mm",
      });
    }
    return out;
  }
}
