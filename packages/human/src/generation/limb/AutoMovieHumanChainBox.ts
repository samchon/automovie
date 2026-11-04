import { AutoMovieHumanLoftChain } from "../../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";

type Vec3 = [number, number, number];

/**
 * Interim accessor (remaining, `log-body.md`): a part's box at a site as
 * today's construction builds it, read on today's chain, for the values the
 * campaign still owes a published law (a foot's, a palm's, a digit's and a
 * toe's breadths and depths, #3049 and #3051). No number is written here:
 * every value is the old chain's own section.
 *
 * The old chain's station nearest the site is the one whose central axis
 * point (`AutoMovieHumanLoftChain.axis`, the section's centroid) stands
 * nearest the site's world point, found among the chain's layers and refined
 * by golden-section search between the neighbouring layers; its ring is read
 * at {@link PHASES} phases and projected on the new part's chart axes about
 * the site's point, so the four extents along `+u`, `+v`, `-u` and `-v` are
 * the box the new part's site takes. Reading a lofted chain's own section is
 * a parametric evaluation: no mesh, no ray.
 *
 * Swapped for the law the moment the input and laws worker lands it.
 */
export namespace AutoMovieHumanChainBox {
  /** Phases read on the old ring. */
  export const PHASES: number = 256;

  /** A box and its fullness. */
  export interface IBox {
    /** The extents `[+u, +v, -u, -v]`, mm. */
    edges: [number, number, number, number];

    /** The mean conic shoulder of the four quarters, in `(0, 1)`. */
    shoulder: number;

    /** The point the extents are measured about: the site's, or the old section's axis point when centred. */
    centre: Vec3;
  }

  /** Golden-section steps refining the nearest station. */
  const STEPS: number = 40;

  /**
   * The old chain's box at a site.
   *
   * @param chain The old chain.
   * @param point The site's point on the new part's axis, calibration mm.
   * @param u The new part's chart `u` there, unit.
   * @param v Its chart `v`, unit.
   * @param centred Whether to measure about the old section's own axis point instead of the site's point (a site past the old chain's end, such as a toe's base inside the forefoot, takes the nearest old section's own box).
   * @returns The extents `[+u, +v, -u, -v]` about the point (the last two negative) and the section's mean conic shoulder, or null when the point lies outside the old section.
   */
  export function at(chain: IAutoMovieHumanLoftChain, site: Vec3, u: Vec3, v: Vec3, centred: boolean = false): IBox | null {
    const point0: Vec3 = site;
    const distance = (s: number): number => {
      const a: Vec3 = AutoMovieHumanLoftChain.axis(chain, s);
      return Math.hypot(a[0] - point0[0], a[1] - point0[1], a[2] - point0[2]);
    };

    // The nearest layer, then golden-section search over its two intervals.
    const layers: number[] = chain.layers.map((l: IAutoMovieHumanLoftChain.ILayer): number => l.y);
    let best: number = 0;
    for (let k: number = 1; k < layers.length; k++) if (distance(layers[k]!) < distance(layers[best]!)) best = k;
    let lo: number = layers[Math.max(0, best - 1)]!;
    let hi: number = layers[Math.min(layers.length - 1, best + 1)]!;
    const g: number = (Math.sqrt(5) - 1) / 2;
    for (let i: number = 0; i < STEPS; i++) {
      const a: number = hi - g * (hi - lo);
      const b: number = lo + g * (hi - lo);
      if (distance(a) < distance(b)) hi = b;
      else lo = a;
    }
    const s: number = (lo + hi) / 2;
    const point: Vec3 = centred ? AutoMovieHumanLoftChain.axis(chain, s) : site;

    // The ring's extents along the new chart's axes about the point.
    const ring: Vec3[] = AutoMovieHumanLoftChain.ring(
      chain,
      s,
      Array.from({ length: PHASES }, (_: unknown, i: number): number => (2 * Math.PI * i) / PHASES),
    );
    const along = (p: Vec3, d: Vec3): number => (p[0] - point[0]) * d[0] + (p[1] - point[1]) * d[1] + (p[2] - point[2]) * d[2];
    const us: number[] = ring.map((p: Vec3): number => along(p, u));
    const vs: number[] = ring.map((p: Vec3): number => along(p, v));
    const edges: [number, number, number, number] = [Math.max(...us), Math.max(...vs), Math.min(...us), Math.min(...vs)];
    if (!(edges[0] > 0 && edges[1] > 0 && edges[2] < 0 && edges[3] < 0)) return null;

    // Each quarter's conic shoulder: between the touch points (a, 0) and
    // (0, b) the conic stands farthest from their chord at its shoulder
    // point (1 + r)(a, b) / 2, along the chord's normal (b, a) / L, where it
    // reaches (1 + r) a b / L against the chord's own a b / L; so
    // r = max(p . n) L / (a b) - 1, read on the old ring and averaged over
    // the four quarters.
    const shoulders: number[] = [0, 1, 2, 3].map((q: number): number => {
      const su: number = q === 0 || q === 3 ? 1 : -1;
      const sv: number = q === 0 || q === 1 ? 1 : -1;
      const a: number = Math.abs(su > 0 ? edges[0] : edges[2]);
      const b: number = Math.abs(sv > 0 ? edges[1] : edges[3]);
      const L: number = Math.hypot(a, b);
      let reach: number = 0;
      for (let i: number = 0; i < ring.length; i++) reach = Math.max(reach, (su * us[i]! * b + sv * vs[i]! * a) / L);
      return (reach * L) / (a * b) - 1;
    });
    const shoulder: number = shoulders.reduce((sum: number, r: number): number => sum + r, 0) / 4;
    return { edges, shoulder: Math.min(1 - 1e-6, Math.max(1e-6, shoulder)), centre: point };
  }
}
