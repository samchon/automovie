import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanCurveProfile } from "./HumanCurveProfile";
import type { HumanCurveRings } from "./HumanCurveRings";

type IRow = HumanAnatomyAudit.IRow;

/**
 * The vault's girth profile on the composed `head.upper` chain (catalog rules
 * PRO-HD-3 and CUR-11): from the chain's widest section, at the head
 * circumference's level through glabella and opisthocranion, up to the
 * vertex the girth falls without a ridge, a plateau or a second rise, and the
 * cap closes onto the vertex with its girth falling to the last station.
 *
 * The cranial vault is one convex dome over the frontal, parietal and
 * occipital bones (Gray 1918), so its horizontal girth falls monotonically
 * from its greatest round to the vertex. The floor is ISO 20685-1:2018 Table
 * 4's 1 mm for head dimensions, as a girth `pi` mm (a 1 mm change of the
 * dome's radius on both sides of a section).
 */
export namespace HumanCurveHeadVault {
  /** Largest excess variation of the vault's fall, mm of girth: a 1 mm head-dimension error on a section's diameter, `pi` mm. */
  export const FLOOR: number = Math.PI * HumanAnatomyShared.HEAD;

  /** The vault rows of one person. */
  export function rows(person: string, vault: HumanCurveRings.IProfile): IRow[] {
    const g: number[] = vault.girth;
    const widest: number = HumanCurveProfile.argmax(g, 0, g.length - 1);
    const fall: number[] = g.slice(widest);
    const last: number = g.length - 1;
    return [
      { person, site: `head.upper vault from its widest section (station ${vault.stations[widest]!.toFixed(0)} mm) to the vertex: excess variation of the girth, mm (PRO-HD-3)`, value: HumanCurveProfile.excess(fall), low: 0, high: FLOOR, unit: "mm" },
      { person, site: "head.upper cap: girth falling over its last two stations, mm (CUR-11)", value: last >= 2 ? g[last - 2]! - g[last]! : NaN, low: Number.MIN_VALUE, high: Infinity, unit: "mm" },
    ];
  }
}
