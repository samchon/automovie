import type { IAutoMovieSolidSurface } from "@automovie/interface";

/**
 * A made mound on a flat wall, in millimetres, for the mixed join's operator tests: closed forms on both surfaces along one loop.
 *
 * The wall is the plane through `origin` spanned by `e1`, `e2` with outward normal `e3`, charted `(x, y)` along them. The loop is its
 * circle of radius `a` about the origin. The mound is `P(s, phi) = origin + (a - s) r(phi) + h e3`, `r = cos(phi) e1 + sin(phi) e2`,
 * `s` the distance in from the loop, `h = lift + tau(phi) s + q s^2 / 2 + c s^3`. Its slope at the loop is `tau`, so the turn between
 * the two outward normals there is `atan(tau)`; the plane square to the loop at a clock is the radial plane, in which the wall is a line
 * and the mound the profile `h(s)`.
 */
export namespace ConstructionMound {
  /** A world point or vector, mm. */
  export type V3 = [number, number, number];

  /** An orthonormal frame, mm. */
  export interface IFrame {
    /** The loop's centre on the wall. */
    origin: V3;

    /** The wall's first chart axis, unit. */
    e1: V3;

    /** The wall's second chart axis, unit and square to `e1`. */
    e2: V3;

    /** The wall's outward normal, `e1 x e2`. */
    e3: V3;
  }

  /** One made mound on its wall. */
  export interface IMound {
    /** The wall's frame. */
    frame: IFrame;

    /** The loop's radius, mm. */
    a: number;

    /** The slope `tau` at a phase with its first and second phase derivatives. */
    slope: (phi: number) => [number, number, number];

    /** The profile's curl `q`, 1 per mm. */
    q: number;

    /** The profile's cubic `c`, 1 per mm squared. */
    c: number;

    /** A lift of the whole mound off its wall, mm. */
    lift: number;
  }

  /** The level frame at the world's origin. */
  export const LEVEL: IFrame = { origin: [0, 0, 0], e1: [1, 0, 0], e2: [0, 1, 0], e3: [0, 0, 1] };

  /** A weighted sum of vectors. */
  export function sum(...terms: [number, V3][]): V3 {
    return terms.reduce((out: V3, [k, v]: [number, V3]): V3 => [out[0] + k * v[0], out[1] + k * v[1], out[2] + k * v[2]], [0, 0, 0]);
  }

  /** The slope `T S(-sin(phi - phi0))` with two phase derivatives, `S` the quintic smoothstep: zero over the half turn where `sin(phi - phi0) >= 0`. */
  export function smoothstep(T: number, phi0: number): (phi: number) => [number, number, number] {
    return (phi: number): [number, number, number] => {
      const x: number = -Math.sin(phi - phi0);
      if (!(x > 0)) return [0, 0, 0];
      const S: number = x * x * x * (10 - 15 * x + 6 * x * x);
      const S1: number = 30 * x * x * (1 - x) * (1 - x);
      const S2: number = 60 * x * (1 - x) * (1 - 2 * x);
      const x1: number = -Math.cos(phi - phi0);
      const x2: number = Math.sin(phi - phi0);
      return [T * S, T * S1 * x1, T * (S2 * x1 * x1 + S1 * x2)];
    };
  }

  /** The level frame turned by an angle about an axis through the world's origin, moved to a new origin. */
  export function tilt(origin: V3, axis: V3, angle: number): IFrame {
    const size: number = Math.hypot(axis[0], axis[1], axis[2]);
    const k: V3 = [axis[0] / size, axis[1] / size, axis[2] / size];
    const turn = (v: V3): V3 => {
      const along: number = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
      const side: V3 = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
      return sum([Math.cos(angle), v], [Math.sin(angle), side], [along * (1 - Math.cos(angle)), k]);
    };
    return { origin, e1: turn([1, 0, 0]), e2: turn([0, 1, 0]), e3: turn([0, 0, 1]) };
  }

  /** The mound's height above its wall at `(s, phi)` with its partial derivatives `[h, h_s, h_phi, h_ss, h_sphi, h_phiphi]`. */
  export function height(m: IMound, s: number, phi: number): [number, number, number, number, number, number] {
    const [tau, tau1, tau2]: [number, number, number] = m.slope(phi);
    return [m.lift + tau * s + (m.q * s * s) / 2 + m.c * s * s * s, tau + m.q * s + 3 * m.c * s * s, tau1 * s, m.q + 6 * m.c * s, tau1, tau2 * s];
  }

  /** The mound's point at `(s, phi)`. */
  export function point(m: IMound, s: number, phi: number): V3 {
    const f: IFrame = m.frame;
    return sum([1, f.origin], [(m.a - s) * Math.cos(phi), f.e1], [(m.a - s) * Math.sin(phi), f.e2], [height(m, s, phi)[0], f.e3]);
  }

  /** The loop on the wall's chart at a clock, with two clock derivatives: the circle of radius `a`, counter-clockwise. */
  export function loop(m: IMound): (t: number) => { point: [number, number]; first: [number, number]; second: [number, number] } {
    return (t: number): { point: [number, number]; first: [number, number]; second: [number, number] } => ({
      point: [m.a * Math.cos(t), m.a * Math.sin(t)],
      first: [-m.a * Math.sin(t), m.a * Math.cos(t)],
      second: [-m.a * Math.cos(t), -m.a * Math.sin(t)],
    });
  }

  /** The wall and the mound as the kernel's surfaces; the mound's chart is `(s, phi)` with `s` inside `[-15, a - 5]`. */
  export function build(m: IMound): { part: IAutoMovieSolidSurface; host: IAutoMovieSolidSurface } {
    const f: IFrame = m.frame;
    const zero: V3 = [0, 0, 0];
    const host: IAutoMovieSolidSurface = {
      name: "wall",
      orientation: 1,
      domain: [-400, 400],
      jet: (x: number, y: number): IAutoMovieSolidSurface.IJet => ({
        p: sum([1, f.origin], [x, f.e1], [y, f.e2]),
        u: [...f.e1],
        v: [...f.e2],
        uu: [...zero],
        uv: [...zero],
        vv: [...zero],
      }),
    };

    // P_s x P_phi points against e3 where the mound is flat, so the outward normal takes the sign -1.
    const part: IAutoMovieSolidSurface = {
      name: "mound",
      orientation: -1,
      period: 2 * Math.PI,
      domain: [-15, m.a - 5],
      jet: (s: number, phi: number): IAutoMovieSolidSurface.IJet => {
        const [, hs, hp, hss, hsp, hpp]: [number, number, number, number, number, number] = height(m, s, phi);
        const r: V3 = sum([Math.cos(phi), f.e1], [Math.sin(phi), f.e2]);
        const t: V3 = sum([-Math.sin(phi), f.e1], [Math.cos(phi), f.e2]);
        return {
          p: point(m, s, phi),
          u: sum([-1, r], [hs, f.e3]),
          v: sum([m.a - s, t], [hp, f.e3]),
          uu: [hss * f.e3[0], hss * f.e3[1], hss * f.e3[2]],
          uv: sum([-1, t], [hsp, f.e3]),
          vv: sum([-(m.a - s), r], [hpp, f.e3]),
        };
      },
    };
    return { part, host };
  }
}
