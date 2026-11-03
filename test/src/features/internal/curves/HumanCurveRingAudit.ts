import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanCurveRings } from "./HumanCurveRings";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * Integrity of every composed chain, layer by layer and station by station
 * (catalog rules CUR-2, CUR-3 and SEC-4), read on the delivered chains by
 * their own evaluator:
 *
 * - CUR-2: neighbouring layer spacings differ by at most a factor of two, so
 *   no row of rings crowds against a sparse one.
 * - CUR-3: the girth profile every 2 mm has no step: its second difference
 *   stays within what the catalog's crease bound makes when it runs round a
 *   whole ring.
 * - SEC-4: a limb, digit or neck ring is star-shaped about its centre: its
 *   points turn one way round the centre, so no part of the ring folds back.
 */
export namespace HumanCurveRingAudit {
  /**
   * Largest second difference of a girth profile sampled every 2 mm, mm.
   * The crease bound, a sagitta of 1 mm over a 10 mm chord, is a meridian
   * curvature of `8 * 1 / 10^2` = 0.08 /mm; round a whole ring it bends the
   * girth by `2 pi` times that, 0.50 /mm, and over a 2 mm step the second
   * difference by `0.50 * 2^2`, 2.0 mm. A step round the ring, a collar or a
   * ridge, passes it; a crease confined to part of the ring bends the girth
   * less and is the kink rules' to read.
   */
  export const STEP: number = 2 * Math.PI * (8 / 100) * HumanCurveRings.STEP ** 2;

  /** Largest ratio of neighbouring layer spacings. */
  export const SPACING: number = 2;

  /** Chains whose sections are star-shaped about their centres: limbs, digits and the neck. */
  export const STAR: RegExp = /^(arm|leg|finger|thumb|toe)\.|^head$/;

  /** Stations at each chain end whose rings close a cap, a fan or the crotch's split, left to the seam and cap rules. */
  export const ENDS: number = 3;

  /** The integrity rows of one person's chains. */
  export function rows(person: string, body: IAutoMovieHumanBodyCalibration, read: (chain: string) => HumanCurveRings.IProfile): IRow[] {
    const out: IRow[] = [];
    for (const chain of body.chains) {
      const name: string = chain.name;
      const row: (site: string, value: number, low: number, high: number, unit: string) => void = (site: string, value: number, low: number, high: number, unit: string): void => {
        out.push({ person, site: `${name} ${site}`, value, low, high, unit });
      };

      // CUR-2: spacing ratios between neighbouring layer intervals.
      const y: number[] = chain.layers.map((l: IAutoMovieHumanLoftChain.ILayer): number => l.y);
      let ratio: number = 1;
      let at: number = 0;
      for (let i: number = 1; i + 1 < y.length; i++) {
        const a: number = y[i]! - y[i - 1]!;
        const b: number = y[i + 1]! - y[i]!;
        const r: number = Math.max(a / b, b / a);
        if (r > ratio) {
          ratio = r;
          at = i;
        }
      }
      row(`layer spacing: largest ratio of neighbouring spacings, at layer ${at} (CUR-2)`, ratio, 1, SPACING + 1e-9, "");

      // CUR-3: the girth profile's largest second difference away from the ends.
      const g: number[] = read(name).girth;
      if (g.length > 2 * ENDS + 3) {
        let worst: number = 0;
        let where: number = 0;
        for (let i: number = 1 + ENDS; i + 1 + ENDS < g.length; i++) {
          const d2: number = Math.abs(g[i + 1]! - 2 * g[i]! + g[i - 1]!);
          if (d2 > worst) {
            worst = d2;
            where = i;
          }
        }
        row(`girth profile: largest second difference over 2 mm stations, ${(where * HumanCurveRings.STEP).toFixed(0)} mm along the chain (CUR-3)`, worst, 0, STEP, "mm");
      }

      // SEC-4 at every layer of a star-shaped chain.
      if (STAR.test(name))
        chain.layers.forEach((l: IAutoMovieHumanLoftChain.ILayer, i: number): void => {
          const ring: V3[] = AutoMovieHumanLoftChain.ring(chain, l.y, HumanCurveRings.PHASES) as V3[];
          row(`/${i} ring points turning backward round its centre (SEC-4)`, backward(ring), 0, 0, "points");
        });
    }
    return out;
  }

  /**
   * Points of a ring whose step turns backward round the ring's area
   * centroid, in the ring's own plane traversed counter-clockwise (the basis
   * is taken from the ring's vector area, Newell's normal, so the ring as a
   * whole turns forward). A star-shaped ring reads zero; a fold, a lobe
   * hooked behind the centre or a crossing reads its backward steps.
   */
  export function backward(ring: V3[]): number {
    const n: V3 = [0, 0, 0];
    for (let i: number = 0; i < ring.length; i++) {
      const a: V3 = ring[i]!;
      const b: V3 = ring[(i + 1) % ring.length]!;
      n[0] += (a[1] - b[1]) * (a[2] + b[2]);
      n[1] += (a[2] - b[2]) * (a[0] + b[0]);
      n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    const [u, w]: [V3, V3] = A.basis(A.unit(n));

    // The basis' third axis is the normal by the right-hand rule, so in (u, w) the ring winds counter-clockwise.
    const flat: [number, number][] = ring.map((p: V3): [number, number] => [A.dot(p, u), A.dot(p, w)]);
    let area: number = 0;
    let cx: number = 0;
    let cy: number = 0;
    for (let i: number = 0; i < flat.length; i++) {
      const [x0, y0]: [number, number] = flat[i]!;
      const [x1, y1]: [number, number] = flat[(i + 1) % flat.length]!;
      const cr: number = x0 * y1 - x1 * y0;
      area += cr / 2;
      cx += ((x0 + x1) * cr) / 6;
      cy += ((y0 + y1) * cr) / 6;
    }
    cx /= area;
    cy /= area;
    const turn: number = Math.sign(area);
    let count: number = 0;
    for (let i: number = 0; i < flat.length; i++) {
      const [x0, y0]: [number, number] = flat[i]!;
      const [x1, y1]: [number, number] = flat[(i + 1) % flat.length]!;
      if (turn * ((x0 - cx) * (y1 - cy) - (x1 - cx) * (y0 - cy)) < 0) count++;
    }
    return count;
  }
}
