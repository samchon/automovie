import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanStretchProfile } from "./AutoMovieHumanStretchProfile";

/** The existing detailed-axis arm transport, extracted without a new shape. */
export namespace AutoMovieHumanBodyWarpAxis {
  /** An arm's displacement along its own axis. */
  export interface IArm {
    /** Displacement `[x, y, z]` of the arm's section at station s, mm. */
    at: (s: number) => [number, number, number];

    /** Bottom station, the distal branch ring; the wrist course is separate. */
    bottom: number;
  }

  /**
   * An arm stretched along its own axis from its top (axillary) ring: the
   * upper arm, above the elbow station, by `rates.upper` and the forearm
   * below it by `rates.lower`, blended over 15 mm. The displacement of a
   * station is the integral of `(rate - 1)` times the axis tangent from the
   * top ring down, tabulated at 1 mm.
   */
  export function stretch(
    chain: IAutoMovieHumanLoftChain,
    elbow: number,
    rates: { upper: number; lower: number },
  ): IArm {
    const bottom: number = chain.layers[0]!.y;
    const T: number = top(chain);
    const profile: AutoMovieHumanStretchProfile.IProfile =
      AutoMovieHumanStretchProfile.create(
        {
          anchor: T,
          blend: 15,
          pieces: [
            { from: elbow, to: T + 1000, rate: rates.upper },
            { from: bottom - 1000, to: elbow, rate: rates.lower },
          ],
        },
        bottom,
        T,
      );
    const n: number = Math.max(1, Math.ceil(T - bottom));
    const h: number = (T - bottom) / n;
    const table: [number, number, number][] = [[0, 0, 0]];
    for (let i: number = 1; i <= n; i++) {
      // From the top down: table[i] is the displacement at T - i h.
      const s: number = T - (i - 0.5) * h;
      const a: [number, number, number] = AutoMovieHumanLoftChain.axis(
        chain,
        Math.min(T, s + 0.5 * h),
      );
      const b: [number, number, number] = AutoMovieHumanLoftChain.axis(
        chain,
        Math.max(bottom, s - 0.5 * h),
      );
      const k: number = profile.rate(s) - 1;
      const prev: [number, number, number] = table[i - 1]!;
      table.push([
        prev[0] + k * (b[0] - a[0]),
        prev[1] + k * (b[1] - a[1]),
        prev[2] + k * (b[2] - a[2]),
      ]);
    }
    return {
      bottom,
      at: (s: number): [number, number, number] => {
        const t: number = Math.min(n, Math.max(0, (T - s) / h));
        const i: number = Math.min(n - 1, Math.floor(t));
        const f: number = t - i;
        const p: [number, number, number] = table[i]!;
        const q: [number, number, number] = table[i + 1]!;
        return [
          p[0] + f * (q[0] - p[0]),
          p[1] + f * (q[1] - p[1]),
          p[2] + f * (q[2] - p[2]),
        ];
      },
    };
  }

  /** Top source station. */
  function top(chain: IAutoMovieHumanLoftChain): number {
    return chain.layers[chain.layers.length - 1]!.y;
  }
}
