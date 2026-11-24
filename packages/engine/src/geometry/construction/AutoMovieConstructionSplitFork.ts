import type { IAutoMovieSolidSurface } from "@automovie/interface";

import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

type Jet = IAutoMovieSolidSurface.IJet;
type Read = IAutoMovieSolidSurface["jet"];

/** Local rectangular charts of the two sides of a single existing fork line. */
export namespace AutoMovieConstructionSplitFork {
  /** The exact fork clock and the common physical reach expressed in its clock. */
  export interface IRange {
    /** The old shared fork address, radians. */
    clock: number;

    /** The smaller supported angular extent of its two incident lines. */
    radius: number;
  }

  /** The compact quintic partition and its first two derivatives. */
  export function weight(x: number): [number, number, number] {
    const y: number = Math.abs(x);
    if (y >= 1) return [0, 0, 0];
    return [
      (1 - y) ** 3 * (1 + 3 * y + 6 * y * y),
      -30 * Math.sign(x) * y * y * (1 - y) ** 2,
      -60 * y * (1 - y) * (1 - 2 * y),
    ];
  }

  /**
   * Continue the agreeing fork through a single regular angular chart.
   * For signed angular distance `x` and compact relaxation `q`, the two
   * addresses are `±hypot(x,q)` and their affine weights have difference
   * `x/hypot(x,q)`. At q=0 the chart is exactly the original one. Cubic
   * vanishing in station preserves both source boundary 2-jets. Only reads
   * inside each incident sector are shared across the corner.
   * The product `4 V (1-V)` uses the existing quintic zero-jet step `V`; its
   * maximum is one, so its full width is the measured mutual fork reach.
   * The factor `1 - x²` guarantees `hypot(x,q) <= 1`: both remaining
   * weights are in [0,1] and `x² + (1-x²)² <= 1` inside the window.
   *
   * @see https://bura.brunel.ac.uk/handle/2438/1959 Shared boundary data in Gregory's compatible patch construction.
   */
  export function prepare(read: Read, length: number, forks: readonly IRange[]): Read {
    const turn: number = 2 * Math.PI;
    return (u: number, c: number): Jet => {
      const s: number = u / length;
      if (!(s > 0 && s < 1)) return read(u, c);
      for (const { clock, radius } of forks) {
        const angle: number = c - clock;
        const x: number = (angle - turn * Math.round(angle / turn)) / radius;
        if (Math.abs(x) >= 1) continue;
        const [ease, ease1, ease2]: [number, number, number] = weight(x);
        const room: number = 1 - x * x;
        const w: number = room * ease;
        const w1: number = room * ease1 - 2 * x * ease;
        const w2: number = room * ease2 - 4 * x * ease1 - 2 * ease;
        const V: number = s ** 3 * (10 - 15 * s + 6 * s * s);
        const V1: number = 30 * s * s * (1 - s) ** 2 / length;
        const V2: number = 60 * s * (1 - s) * (1 - 2 * s) / (length * length);
        const b: number = 4 * V * (1 - V);
        const b1: number = 4 * V1 * (1 - 2 * V);
        const b2: number = 4 * (V2 * (1 - 2 * V) - 2 * V1 * V1);
        const inv: number = 1 / radius;
        const q: number = b * w;
        const qu: number = b1 * w, qv: number = b * w1 * inv;
        const quu: number = b2 * w, quv: number = b1 * w1 * inv, qvv: number = b * w2 * inv * inv;
        const d: number = Math.hypot(x, q);
        if (!(d * radius > turn * Number.EPSILON)) return read(u, c);
        const du: number = q * qu / d, dv: number = (x * inv + q * qv) / d;
        const duu: number = (qu * qu + q * quu - du * du) / d;
        const duv: number = (qu * qv + q * quv - du * dv) / d;
        const dvv: number = (inv * inv + qv * qv + q * qvv - dv * dv) / d;
        const r: number = x / d;
        const ru: number = -r * du / d, rv: number = (inv - r * dv) / d;
        const a: number = (1 + r) / 2;
        const au: number = ru / 2, av: number = rv / 2;
        const auu: number = -(2 * ru * du + r * duu) / (2 * d);
        const auv: number = -(ru * dv + rv * du + r * duv) / (2 * d);
        const avv: number = -(2 * rv * dv + r * dvv) / (2 * d);
        const side = (sign: 1 | -1): Jet => {
          const k: number = radius * sign;
          const j: Jet = read(u, clock + k * d);
          const g: number = k * du, h: number = k * dv;
          return {
            p: j.p,
            u: Vec.combine([[1, j.u], [g, j.v]]),
            v: Vec.scale(j.v, h),
            uu: Vec.combine([[1, j.uu], [2 * g, j.uv], [g * g, j.vv], [k * duu, j.v]]),
            uv: Vec.combine([[h, j.uv], [g * h, j.vv], [k * duv, j.v]]),
            vv: Vec.combine([[h * h, j.vv], [k * dvv, j.v]]),
          };
        };
        const left: Jet = side(-1), right: Jet = side(1);
        const p = Vec.sub(right.p, left.p);
        const U = Vec.sub(right.u, left.u);
        const Q = Vec.sub(right.v, left.v);
        return {
          p: Vec.combine([[1, left.p], [a, p]]),
          u: Vec.combine([[1, left.u], [a, U], [au, p]]),
          v: Vec.combine([[1, left.v], [a, Q], [av, p]]),
          uu: Vec.combine([[1 - a, left.uu], [a, right.uu], [2 * au, U], [auu, p]]),
          uv: Vec.combine([[1 - a, left.uv], [a, right.uv], [au, Q], [av, U], [auv, p]]),
          vv: Vec.combine([[1 - a, left.vv], [a, right.vv], [2 * av, Q], [avv, p]]),
        };
      }
      return read(u, c);
    };
  }
}
