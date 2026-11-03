import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
const A = HumanAnatomy;
const { SIDES, FOOT, identity, ratio, extentAlong, symmetry } = HumanAnatomyShared;

/** The foot audit: its sites, located on a subject's skin by their published definitions, and their rows. */
export namespace HumanAnatomyFoot {
  /** The feet, flat at the neutral pose: ISO 7250-1 length and breadth. */
  export function foot(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const p: IAutoMovieHumanParameters = subject.params;
    const skin: HumanAnatomy.ISkin = subject.neutral();
    for (const side of SIDES) {
      const own = p.extremities?.feet?.[side];
      const f: { length: number; breadth: number } = footSites(skin, side);
      if (own !== undefined) {
        rows.push(identity(name, `${side} foot length, heel to the longest toe along the foot axis, mm`, f.length, own.footLength, FOOT));
        rows.push(identity(name, `${side} foot breadth, maximum across the foot axis, mm`, f.breadth, own.footBreadth, FOOT));
      }
      // ANSUR II: breadth over length 0.377 (women) and 0.376 (men), its spread
      // bounded by the women's coefficients of variation of breadth (0.052) and
      // length (0.050) taken as uncorrelated: SD 0.027, 2.326 SD either side.
      rows.push(ratio(name, `${side} foot breadth / length`, f.breadth / f.length, 0.314, 0.440));
    }
    rows.push(...symmetry(name, subject.bind(), /^(foot|forefoot|toe)/, "feet"));
    return rows;
  }

  /** Foot length and breadth along the footprint's principal axis, at the neutral pose. */
  export function footSites(skin: HumanAnatomy.ISkin, side: "left" | "right"): { length: number; breadth: number } {
    const points: V3[] = A.vertices(skin, new RegExp(`^(foot|forefoot|toe)\\.${side}`));
    const print: V3[] = points.filter((p: V3): boolean => p[1] < 15);
    const mx: number = print.reduce((s: number, p: V3): number => s + p[0], 0) / print.length;
    const mz: number = print.reduce((s: number, p: V3): number => s + p[2], 0) / print.length;
    let xx: number = 0;
    let xz: number = 0;
    let zz: number = 0;
    for (const p of print) {
      xx += (p[0] - mx) ** 2;
      xz += (p[0] - mx) * (p[2] - mz);
      zz += (p[2] - mz) ** 2;
    }
    const angle: number = 0.5 * Math.atan2(2 * xz, xx - zz);
    const along: V3 = [Math.cos(angle), 0, Math.sin(angle)];
    const across: V3 = [-Math.sin(angle), 0, Math.cos(angle)];
    return { length: extentAlong(points, along), breadth: extentAlong(points, across) };
  }

}
