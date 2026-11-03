import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanOnce } from "../HumanOnce";
import { HumanCurveProfile } from "./HumanCurveProfile";
import { HumanCurveRings } from "./HumanCurveRings";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;

/**
 * The trunk's three outlines on its composed chains, `trunk` from the crotch
 * ring up to the axilla and `upper` on to the neck's base, sampled every 2 mm
 * of height: the front (most anterior skin), the back (most posterior) and
 * the side (widest half breadth). Each outline's interior turns, beyond a
 * 2 mm floor, must be the ones anatomy gives it in their order (catalog rules
 * PRO-TR-6 to PRO-TR-8):
 *
 * - the back: the buttocks' prominence, the lumbar lordosis, the thoracic
 *   kyphosis (Gray 1918's sagittal curves), so its posterior reach turns
 *   max, min, max from the bottom up;
 * - the side: the hips, the waist, the shoulders, so the half breadth turns
 *   max, min, max;
 * - the front: at most an abdominal rise and the epigastric hollow, then the
 *   bust (feminine) or chest; it turns at most max, min, max, and a feminine
 *   person's front ends its turns with the bust's maximum.
 */
export namespace HumanCurveTrunkOutline {
  /** One height of the trunk. */
  export interface IStation {
    /** Height, input mm. */
    y: number;

    /** Most anterior skin, x, input mm. */
    front: number;

    /** Posterior reach, minus the most posterior x, input mm. */
    back: number;

    /** Widest half breadth, input mm. */
    side: number;
  }

  /** The turn floor, mm: the station step of the back's profile (`HumanAnatomySpine.FLOOR`). */
  export const FLOOR: number = 2;

  /** The trunk's outlines, sampled once per person. */
  export function outline(person: string, body: IAutoMovieHumanBodyCalibration, k: number): IStation[] {
    return cache.read(person, (): IStation[] => sample(body, k));
  }

  /** The trunk's outlines of any body, uncached. */
  export function sample(body: IAutoMovieHumanBodyCalibration, k: number): IStation[] {
    const out: IStation[] = [];
    for (const name of ["trunk", "upper"]) {
      const c: IAutoMovieHumanLoftChain = body.chains.find((x: IAutoMovieHumanLoftChain): boolean => x.name === name)!;
      const lo: number = c.layers[0]!.y;
      const hi: number = c.layers[c.layers.length - 1]!.y;
      const count: number = Math.max(1, Math.round(((hi - lo) * k) / HumanCurveRings.STEP));
      for (let i: number = name === "trunk" ? 0 : 1; i <= count; i++) {
        const y: number = lo + ((hi - lo) * i) / count;
        const ring: V3[] = AutoMovieHumanLoftChain.ring(c, y, HumanCurveRings.PHASES) as V3[];
        out.push({
          y: y * k,
          front: Math.max(...ring.map((p: V3): number => p[0])) * k,
          back: -Math.min(...ring.map((p: V3): number => p[0])) * k,
          side: Math.max(...ring.map((p: V3): number => Math.abs(p[2]))) * k,
        });
      }
    }
    return out;
  }

  /** The outline rows of one person: each outline's interior turns against the anatomical sequence. */
  export function rows(person: string, stations: IStation[], feminine: boolean): IRow[] {
    const kinds: (values: number[]) => string = (values: number[]): string => HumanCurveProfile.turns(values, FLOOR).map((t: HumanCurveProfile.ITurn): string => t.kind).join(" ");
    const out: IRow[] = [];
    const row: (site: string, ok: boolean, read: string) => void = (site: string, ok: boolean, read: string): void => {
      out.push({ person, site: `${site}: turns read bottom to top "${read}"`, value: ok ? 0 : 1, low: 0, high: 0, unit: "mismatch" });
    };

    const back: string = kinds(stations.map((s: IStation): number => s.back));
    row("trunk back outline turns max (buttocks), min (lordosis), max (kyphosis) (PRO-TR-7)", back === "max min max", back);

    // The hips' widest may stand at or below the crotch ring, where the trunk chain begins, so its maximum may be the outline's first value.
    const side: string = kinds(stations.map((s: IStation): number => s.side));
    row("trunk side outline turns max (hips), min (waist), max (shoulders), the hips' maximum allowed at the crotch ring (PRO-TR-8)", side === "max min max" || side === "min max", side);

    // PRO-SH-1: above the shoulders' widest the half breadth falls to the
    // neck's base without a shelf or a second rise: the trapezius' upper
    // border runs from the shoulder point to the side neck point in one
    // falling line (Gray 1918), within the 2 mm floor.
    const widths: number[] = stations.map((s: IStation): number => s.side);
    const top: number = widths.reduce((best: number, v: number, i: number): number => (i >= widths.length / 2 && v > widths[best]! ? i : best), Math.floor(widths.length / 2));
    const fall: number = HumanCurveProfile.excess(widths.slice(top));
    out.push({ person, site: `trunk side outline from the shoulders' widest to the neck's base: excess variation, mm (PRO-SH-1)`, value: fall, low: 0, high: FLOOR, unit: "mm" });

    // The front: an optional abdominal rise and epigastric hollow, then the
    // chest's or bust's maximum, which a feminine front must show.
    const front: string = kinds(stations.map((s: IStation): number => s.front));
    const allowed: string[] = feminine ? ["max", "max min max"] : ["", "max", "max min max"];
    row(`trunk front outline turns ${feminine ? "to the bust's maximum" : "at most to the chest's maximum"} (PRO-TR-6)`, allowed.includes(front), front);
    return out;
  }

  /**
   * XF-TR-3: a feminine person's bust, the front outline's highest
   * maximum, stands at the chest point's height: ANSUR II chest height over
   * stature, each sex's mean plus and minus 2.326 SD and the union, 0.6867 to
   * 0.7596 (`ansur-ii-trunk-ratios.md`, the trunk audit's band). NaN when the
   * front shows no maximum, which the front's own row then reads.
   */
  export function bust(person: string, stations: IStation[], stature: number): IRow {
    const turns: HumanCurveProfile.ITurn[] = HumanCurveProfile.turns(stations.map((s: IStation): number => s.front), FLOOR).filter((t: HumanCurveProfile.ITurn): boolean => t.kind === "max");
    const top: HumanCurveProfile.ITurn | undefined = turns[turns.length - 1];
    const y: number = top === undefined ? NaN : stations[top.index]!.y;
    return { person, site: `trunk front outline's bust maximum at ${y.toFixed(0)} mm: height over stature (XF-TR-3)`, value: y / stature, low: 0.6867, high: 0.7596, unit: "" };
  }

  /**
   * PRO-TR-3 on the composed trunk chain: the trunk's least girth between
   * the buttocks' level (0.47 S) and the axilla's (0.76 S) is the natural
   * waist, so it stands within 0.56 S to 0.70 S, the band the trunk audit
   * seeks the natural waist in, which holds ANSUR II's iliocristale (0.611 S
   * women, 0.605 S men) and tenth rib (0.649 and 0.638 S) heights between
   * which the natural waist lies by definition.
   *
   * @param person Name in the row.
   * @param trunk The `trunk` chain's girth profile; its stations are heights.
   * @param stature The stature input, mm.
   */
  export function waist(person: string, trunk: HumanCurveRings.IProfile, stature: number): IRow {
    let least: number = Infinity;
    let at: number = NaN;
    trunk.stations.forEach((y: number, i: number): void => {
      if (y >= 0.47 * stature && y <= 0.76 * stature && trunk.girth[i]! < least) {
        least = trunk.girth[i]!;
        at = y;
      }
    });
    return { person, site: `trunk's least girth from 0.47 S to 0.76 S, at ${at.toFixed(0)} mm: height over stature (PRO-TR-3)`, value: at / stature, low: 0.56, high: 0.7, unit: "" };
  }
}

/** Every person's trunk outlines, sampled once per process. */
const cache: HumanOnce<HumanCurveTrunkOutline.IStation[]> = new HumanOnce();
