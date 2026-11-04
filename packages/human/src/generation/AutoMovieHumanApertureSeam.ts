import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanApertureSpan } from "./AutoMovieHumanApertureSpan";

/**
 * A slit opening's rim drawn on its base chains as the line it closes on: each
 * point of the trim loop keeps its phase and moves along its chain's station
 * until the surface stands on the slit's contact line, kept `closed` off it on
 * its own side, so the two lips meet and stay apart by place. The rim is a
 * curve on the lofted surface; nothing is moved after tessellation.
 *
 * A point whose move would leave its chain through a ring the chain shares
 * with a neighbour goes on on the neighbour: at the ring it takes the phase
 * of the same point on the neighbour's section (the ring's copy) and keeps
 * moving there. The station's rate is a difference taken inside the chain,
 * one-sided at its ends.
 */
export namespace AutoMovieHumanApertureSeam {
  /** Newton steps of a point's station onto its line. */
  const STEPS: number = 12;

  /** Station step of the height's derivative, mm. */
  const STEP: number = 0.01;

  /**
   * The trim loop of a slit with its points on the closing line.
   *
   * @param points The trim loop's points on their chains.
   * @param seam The slit's closing line.
   * @param chainOf The chain of a name.
   * @param across The chain beyond an end of a chain, at a phase of its ring, through the ring they share, or null.
   */
  export function drawn(
    points: readonly AutoMovieHumanApertureSpan.IPoint[],
    seam: NonNullable<IAutoMovieHumanLoftAperture["seam"]>,
    chainOf: (name: string) => IAutoMovieLoftChain,
    across: (name: string, end: "bottom" | "top", t: number) => IAutoMovieLoftChain | null,
  ): AutoMovieHumanApertureSpan.IPoint[] {
    const n: number = seam.contact.length - 1;
    const line = (z: number): number => {
      const u: number = Math.min(1, Math.abs(z) / seam.width) * n;
      const i: number = Math.min(n - 1, Math.floor(u));
      return seam.contact[i]! + (u - i) * (seam.contact[i + 1]! - seam.contact[i]!);
    };
    return points.map((p: AutoMovieHumanApertureSpan.IPoint): AutoMovieHumanApertureSpan.IPoint => {
      let chain: IAutoMovieLoftChain = chainOf(p.chain);
      let s: number = p.s;
      let t: number = p.t;
      const start: [number, number, number] = AutoMovieLoftChain.point(chain, s, t);
      const side: number = start[1] >= line(start[2]) ? 1 : -1;
      let crossed: boolean = false;
      for (let k: number = 0; k < STEPS; k++) {
        const y0: number = chain.layers[0]!.y;
        const y1: number = chain.layers[chain.layers.length - 1]!.y;
        const q: [number, number, number] = AutoMovieLoftChain.point(chain, s, t);
        const miss: number = q[1] - (line(q[2]) + side * seam.closed);
        if (Math.abs(miss) < 1e-6) break;
        const h: number = s + STEP <= y1 ? STEP : -STEP;
        const r: [number, number, number] = AutoMovieLoftChain.point(chain, s + h, t);
        const rate: number = (r[1] - line(r[2]) - (q[1] - line(q[2]))) / h;
        if (!(Math.abs(rate) > 1e-9)) break;
        const next: number = s - miss / rate;
        if (next >= y0 && next <= y1) {
          s = next;
          continue;
        }

        // Past the chain's end: on through the ring into the neighbour, once.
        const end: "bottom" | "top" = next > y1 ? "top" : "bottom";
        const ring: number = end === "top" ? y1 : y0;
        const beyond: IAutoMovieLoftChain | null = crossed ? null : across(chain.name, end, t);
        if (beyond === null) {
          s = ring;
          continue;
        }
        const point: [number, number, number] = AutoMovieLoftChain.point(chain, ring, t);
        t = AutoMovieHumanApertureSpan.phaseOf(beyond, ring, point, t);
        chain = beyond;
        s = ring;
        crossed = true;
      }
      return { chain: chain.name, s, t };
    });
  }
}
