import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanRelief } from "../../../../../packages/human/src/network/IAutoMovieHumanRelief";
import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanCurveRings } from "./HumanCurveRings";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * Merging by added volume on the composed chains (catalog rule MRG-5): each
 * chain that carries reliefs is evaluated twice at the same stations and
 * phases, as delivered (the merged surface) and with its reliefs removed (the
 * base envelope). Inside every relief's window the merged point less the base
 * point is read along the base's outward normal, and a relief is one-signed:
 * an additive piece (its largest displacement outward) never goes inward, and
 * a subtractive piece (its largest displacement inward: the umbilicus, the
 * spinal furrow, the jugular notch) never goes outward, each within a
 * hundredth of a millimetre. A relief that changes sign is the failure, the
 * same claim `test_human_trunk_merge` reads on the trunk's pieces.
 */
export namespace HumanCurveMerge {
  /** Least outward displacement inside a window, mm: a hundredth of a millimetre, far under any modelled feature. */
  export const INWARD: number = -0.01;

  /** The merge rows of one body's chains. */
  export function rows(person: string, body: IAutoMovieHumanBodyCalibration): IRow[] {
    const out: IRow[] = [];
    for (const chain of body.chains) {
      const reliefs: IAutoMovieHumanRelief[] = chain.reliefs ?? [];
      if (reliefs.length === 0) continue;
      const base: IAutoMovieHumanLoftChain = { ...chain, reliefs: [] };
      const first: number = chain.layers[0]!.y;
      const last: number = chain.layers[chain.layers.length - 1]!.y;

      for (const relief of reliefs) {
        let inward: number = Infinity;
        let outmost: number = -Infinity;
        let outmostAt: string = "";
        let inwardAt: string = "";
        const lo: number = Math.max(first, relief.stations[0]);
        const hi: number = Math.min(last, relief.stations[1]);
        for (let s: number = lo; s <= hi; s += 1) {
          const merged: V3[] = AutoMovieHumanLoftChain.ring(chain, s, HumanCurveRings.PHASES) as V3[];
          const plain: V3[] = AutoMovieHumanLoftChain.ring(base, s, HumanCurveRings.PHASES) as V3[];
          const normals: V3[] = outward(plain);
          HumanCurveRings.PHASES.forEach((t: number, j: number): void => {
            const d: V3 = A.sub(merged[j]!, plain[j]!);
            if (inWindow(relief, s, t)) {
              const h: number = A.dot(d, normals[j]!);
              if (h > outmost) {
                outmost = h;
                outmostAt = `station ${s.toFixed(0)}, phase ${((t * 180) / Math.PI).toFixed(0)} deg`;
              }
              if (h < inward) {
                inward = h;
                inwardAt = `station ${s.toFixed(0)}, phase ${((t * 180) / Math.PI).toFixed(0)} deg`;
              }
            }
          });
        }
        // The relief is additive when its largest displacement is outward, subtractive when inward; either way it never takes the other sign.
        const additive: boolean = outmost >= -inward;
        out.push({
          person,
          site: `${chain.name} relief ${relief.name}, ${additive ? "additive" : "subtractive"} by its largest displacement (${(additive ? outmost : inward).toFixed(2)} mm): its displacement of the other sign, at ${additive ? inwardAt : outmostAt} (MRG-5)`,
          value: additive ? inward : -outmost,
          low: INWARD,
          high: Infinity,
          unit: "mm",
        });
      }
    }
    return out;
  }

  /** Whether a station and phase lie in a relief's window, the phase range read forward and wrapping past 2 pi. */
  export function inWindow(r: IAutoMovieHumanRelief, s: number, t: number): boolean {
    if (s < r.stations[0] || s > r.stations[1]) return false;
    const TWO: number = 2 * Math.PI;
    const span: number = (((r.phases[1] - r.phases[0]) % TWO) + TWO) % TWO;
    const at: number = (((t - r.phases[0]) % TWO) + TWO) % TWO;
    return at <= span;
  }

  /**
   * Unit outward normals of a ring in its own plane: each point's tangent
   * (its neighbours' chord) crossed with the plane's normal (Newell's), the
   * sign chosen once for the whole ring so the normals point away from its
   * area centre on balance, which holds for any simple ring however concave.
   */
  export function outward(ring: V3[]): V3[] {
    const n: V3 = [0, 0, 0];
    const c: V3 = [0, 0, 0];
    for (let i: number = 0; i < ring.length; i++) {
      const a: V3 = ring[i]!;
      const b: V3 = ring[(i + 1) % ring.length]!;
      n[0] += (a[1] - b[1]) * (a[2] + b[2]);
      n[1] += (a[2] - b[2]) * (a[0] + b[0]);
      n[2] += (a[0] - b[0]) * (a[1] + b[1]);
      for (let k: number = 0; k < 3; k++) c[k]! += a[k]! / ring.length;
    }
    const plane: V3 = A.unit(n);
    const raw: V3[] = ring.map((_: V3, i: number): V3 => A.unit(A.cross(A.sub(ring[(i + 1) % ring.length]!, ring[(i - 1 + ring.length) % ring.length]!), plane)));
    const balance: number = raw.reduce((sum: number, v: V3, i: number): number => sum + A.dot(v, A.sub(ring[i]!, c)), 0);
    return balance >= 0 ? raw : raw.map((v: V3): V3 => A.scale(v, -1));
  }
}
