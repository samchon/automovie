import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";

/**
 * A slit opening's rim drawn on its base chain as the line it closes on: each
 * point of the trim loop keeps its phase and moves along the chain's station
 * until the surface stands on the slit's contact line, kept `closed` off it on
 * its own side, so the two lips meet and stay apart by place. The rim is a
 * curve on the lofted surface; nothing is moved after tessellation.
 */
export namespace AutoMovieHumanApertureSeam {
  /** Newton steps of a point's station onto its line. */
  const STEPS: number = 8;

  /** Station step of the height's derivative, mm. */
  const STEP: number = 0.01;

  /**
   * The trim loop of a slit with its points on the closing line.
   *
   * @param chain The base chain.
   * @param loop The trim loop, `[station, phase]` per point.
   * @param seam The slit's closing line.
   */
  export function drawn(
    chain: IAutoMovieHumanLoftChain,
    loop: readonly [number, number][],
    seam: NonNullable<IAutoMovieHumanLoftAperture["seam"]>,
  ): [number, number][] {
    const n: number = seam.contact.length - 1;
    return loop.map(([s0, t]: [number, number]): [number, number] => {
      const start: [number, number, number] = AutoMovieHumanLoftChain.ring(chain, s0, [t])[0]!;
      const line: (z: number) => number = (z: number): number => {
        const u: number = Math.min(1, Math.abs(z) / seam.width) * n;
        const i: number = Math.min(n - 1, Math.floor(u));
        return seam.contact[i]! + (u - i) * (seam.contact[i + 1]! - seam.contact[i]!);
      };
      const side: number = start[1] >= line(start[2]) ? 1 : -1;
      let s: number = s0;
      for (let k: number = 0; k < STEPS; k++) {
        const p: [number, number, number] = AutoMovieHumanLoftChain.ring(chain, s, [t])[0]!;
        const miss: number = p[1] - (line(p[2]) + side * seam.closed);
        if (Math.abs(miss) < 1e-6) break;
        const q: [number, number, number] = AutoMovieHumanLoftChain.ring(chain, s + STEP, [t])[0]!;
        const rate: number = (q[1] - line(q[2]) - (p[1] - line(p[2]))) / STEP;
        if (!(Math.abs(rate) > 1e-9)) break;
        s -= miss / rate;
      }
      return [s, t];
    });
  }
}
