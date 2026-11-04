import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import type { HumanCurveRings } from "./HumanCurveRings";

type IRow = HumanAnatomyAudit.IRow;

/**
 * The order of the digits' thickness on their composed chains (catalog rules
 * ORD-HN-1 and ORD-FT-3): each digit's girth is its chain's widest section
 * over the first half of the chain (the proximal phalanx, clear of the tip's
 * cap), and the digits stand in anatomy's order of thickness.
 *
 * - ORD-HN-1: the thumb is thicker than the middle finger, and the little
 *   finger thinner than the index, middle and ring fingers (Greiner 1991's
 *   digit breadths; Bridgman 1920: "the little finger is the smallest").
 * - ORD-FT-3: the hallux is thicker than the second toe, and the second than
 *   the fifth.
 */
export namespace HumanCurveDigitGirth {
  /** A digit's girth: its chain's widest section over the chain's first half, mm; NaN without a chain. */
  export function girth(body: IAutoMovieHumanBodyCalibration, chain: string, read: (name: string) => HumanCurveRings.IProfile): number {
    if (!body.chains.some((c: IAutoMovieHumanLoftChain): boolean => c.name === chain)) return NaN;
    const g: number[] = read(chain).girth;
    return Math.max(...g.slice(0, Math.max(1, Math.ceil(g.length / 2))));
  }

  /** The digit order rows of one person. */
  export function rows(person: string, body: IAutoMovieHumanBodyCalibration, read: (name: string) => HumanCurveRings.IProfile): IRow[] {
    const out: IRow[] = [];
    const thicker: (site: string, a: number, b: number) => void = (site: string, a: number, b: number): void => {
      out.push({ person, site, value: a - b, low: Number.MIN_VALUE, high: Infinity, unit: "mm" });
    };
    for (const side of HumanAnatomyShared.SIDES) {
      const f: (name: string) => number = (name: string): number => girth(body, `finger.${side}.${name}`, read);
      const thumb: number = girth(body, `thumb.${side}`, read);
      thicker(`${side} thumb thicker than the middle finger, mm (ORD-HN-1)`, thumb, f("middle"));
      for (const other of ["index", "middle", "ring"]) thicker(`${side} ${other} finger thicker than the little finger, mm (ORD-HN-1)`, f(other), f("little"));
      const t: (k: number) => number = (k: number): number => girth(body, `toe.${side}.${k}`, read);
      thicker(`${side} hallux thicker than the second toe, mm (ORD-FT-3)`, t(1), t(2));
      thicker(`${side} second toe thicker than the fifth, mm (ORD-FT-3)`, t(2), t(5));
    }
    return out;
  }
}
