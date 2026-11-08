import { AutoMovieConstructionKnownPort, type AutoMovieViewAxis, type IAutoMovieConstructionKnownPortSource, type IAutoMovieSolidSurface } from "@automovie/engine";

import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanTrunkPelvisSplit } from "../trunk/AutoMovieHumanTrunkPelvisSplit";
import { AutoMovieHumanLegHipBand } from "./AutoMovieHumanLegHipBand";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type IJet = IAutoMovieSolidSurface.IJet;
type IMapJet = IAutoMovieConstructionKnownPortSource.IJet;

/**
 * The thigh's root on the trunk's pants split (`AutoMovieHumanTrunkPelvisSplit`):
 * a known-port band (`AutoMovieConstructionKnownPort`, the quintic partition
 * of unity between two actual C2 fields) from the trunk's side of the split at
 * the crotch level (transverse 0) to the leg's own lofted surface at its rail
 * (transverse 1), a station below the crotch on the leg's course.
 *
 * Clock `c` in [0, 2 pi): on [0, pi] the S00 bottom ring's half on this side
 * from the back midline through the lateral side to the front midline (S00
 * phase `pi + c` on the left, `pi - c` on the right, f1_trunk's orientation);
 * on [pi, 2 pi] the medial seam chord from the front midline point back to
 * the back midline point. The two midline points are the seam's declared
 * creases.
 *
 * Parent field (the root continuation, chart `(s, c)`, `s` mm below the
 * crotch): on the outer half the C2 continuation of S00 below its bottom by
 * its own end jets, `R(c) + s A(c) + s^2/2 B(c)` with `A = -S00_u` and
 * `B = +S00_uu` (S00's station runs up, so the downward parameter reverses the
 * first derivative only). `R` and its clock derivatives are S00's own (`v`,
 * `vv`); `A` and `B` are natural cubic splines in `c` through their values at
 * 33 clock nodes (a smooth fit, so every derivative is the map's own, as
 * `IAutoMovieSolidSurface` requires). On the seam the chord continues straight
 * down (`A` = -Y, `B` = 0).
 *
 * Child map: `(c, v) -> (v D, phi(c))` on the leg's chain, `D` the rail's
 * station below the crotch, `phi(c)` the angle of `R(c)` about the leg's
 * course at the crotch level in the chain's own phase convention, unwrapped.
 * Parent map: `(c, v) -> (v D, c)`. So both sides meet at the same heights,
 * and the band equals the trunk at the crotch and the leg at the rail with
 * their whole second-order jets.
 */
export namespace AutoMovieHumanLegHipRoot {
  /** What the root reads. */
  export interface IInput {
    /** The trunk's split, world. */
    split: AutoMovieHumanTrunkPelvisSplit.IOutput;

    /** Which leg. */
    side: "left" | "right";

    /** The leg's lofted surface, world, chart (course station from the crotch-level port, phase). */
    leg: IAutoMovieSolidSurface;

    /** The leg's course axis, world (the section frame at a station). */
    axis: AutoMovieViewAxis.IAxis;

    /** The rail's station below the crotch on the leg's course, mm. */
    depth: number;

    /** The gluteal sulcus as a declared crease at the rail, clocks from the back midline: full weight to `apex`, fading to C2 over `transition` (AutoMovieHumanLegHipBand); absent, the engine's C2 known-port band. */
    crease?: { apex: number; transition: number };
  }

  /** The root. */
  export interface IOutput {
    /** The band surface, chart (transverse 0..1, clock), or null with the refusal in diagnostics. */
    band: IAutoMovieSolidSurface | null;

    /** The root-continuation field. */
    root: IAutoMovieSolidSurface;

    /** The port loop at clock `c`, world. */
    loop: (c: number) => Vec3;

    /** The leg phase the band reads at clock `c`. */
    phase: (c: number) => number;

    /** The rail's station below the crotch, mm. */
    depth: number;

    /** Constructor notes. */
    diagnostics: string[];
  }

  /** Build the band. */
  export function create(input: IInput): IOutput {
    const diagnostics: string[] = [];
    const half: AutoMovieHumanTrunkPelvisSplit.IHalf = input.side === "left" ? input.split.left : input.split.right;
    const dir: 1 | -1 = input.side === "left" ? 1 : -1;
    const s00Phase: (c: number) => number = (c: number): number => Math.PI + dir * c;
    const front: Vec3 = input.split.seam.front;
    const back: Vec3 = input.split.seam.back;

    // A and B as natural cubic splines in c over the outer half.
    const nodes: number = 32;
    const cs: number[] = Array.from({ length: nodes + 1 }, (_: unknown, k: number): number => (Math.PI * k) / nodes);
    const jets: IJet[] = cs.map((c: number): IJet => half.jet(s00Phase(c)));
    const A: Spline = spline(cs, jets.map((j: IJet): Vec3 => [-j.u[0], -j.u[1], -j.u[2]]));
    const B: Spline = spline(cs, jets.map((j: IJet): Vec3 => [j.uu[0], j.uu[1], j.uu[2]]));

    // The loop and its clock derivatives.
    const loopJet: (c: number) => [Vec3, Vec3, Vec3] = (c: number): [Vec3, Vec3, Vec3] => {
      const x: number = wrap(c);
      if (x <= Math.PI) {
        const j: IJet = half.jet(s00Phase(x));
        return [vec(j.p), scale(vec(j.v), dir), vec(j.vv)];
      }
      const t: number = (x - Math.PI) / Math.PI;
      return [add(front, scale(sub(back, front), t)), scale(sub(back, front), 1 / Math.PI), [0, 0, 0]];
    };
    const root: IAutoMovieSolidSurface = {
      name: `leg.${input.side}.root`,
      orientation: 1,
      jet(s: number, c: number): IJet {
        const x: number = wrap(c);
        const [R, R1, R2]: [Vec3, Vec3, Vec3] = loopJet(x);
        if (x > Math.PI) {
          const down: Vec3 = [0, -1, 0];
          return { p: add(R, scale(down, s)), u: down, v: R1, uu: [0, 0, 0], uv: [0, 0, 0], vv: R2 };
        }
        const [a, a1, a2]: [Vec3, Vec3, Vec3] = A(x);
        const [b, b1, b2]: [Vec3, Vec3, Vec3] = B(x);
        return {
          p: add(add(R, scale(a, s)), scale(b, (s * s) / 2)),
          u: add(a, scale(b, s)),
          v: add(add(R1, scale(a1, s)), scale(b1, (s * s) / 2)),
          uu: b,
          uv: add(a1, scale(b1, s)),
          vv: add(add(R2, scale(a2, s)), scale(b2, (s * s) / 2)),
        };
      },
    };

    // The leg phase of each clock: the loop's angle about the leg's crotch-level section, unwrapped.
    const plane: { origin: Vec3; u: Vec3; v: Vec3 } = input.axis.at(0);
    const angle: (c: number) => [number, number, number] = (c: number): [number, number, number] => {
      const [R, R1, R2]: [Vec3, Vec3, Vec3] = loopJet(c);
      const d: Vec3 = sub(R, plane.origin);
      const x: number = dot(d, plane.u);
      const y: number = dot(d, plane.v);
      const x1: number = dot(R1, plane.u);
      const y1: number = dot(R1, plane.v);
      const x2: number = dot(R2, plane.u);
      const y2: number = dot(R2, plane.v);
      const r2: number = x * x + y * y;
      const w: number = x * y1 - y * x1;
      const p1: number = w / r2;
      const p2: number = ((x * y2 - y * x2) * r2 - w * 2 * (x * x1 + y * y1)) / (r2 * r2);
      return [Math.atan2(y, x), p1, p2];
    };
    const start: number = angle(0)[0];
    const sense: number = Math.sign(angle(Math.PI / 2)[1]);
    const phase: (c: number) => number = (c: number): number => {
      const raw: number = angle(c)[0];
      const guess: number = start + sense * wrap(c);
      return raw + 2 * Math.PI * Math.round((guess - raw) / (2 * Math.PI));
    };
    const D: number = input.depth;
    // The parent's transverse runs by distance, not by S00 station: at clock
    // c the root moves `s = v T(c) / |A(c)|` along S00's own surface
    // direction, `T(c)` the straight distance from the ring point to the
    // leg's rail point at the same clock (a natural cubic spline in the clock
    // through 65 nodes), so the continuation reaches about as far as the rail
    // it blends into whatever the underside's slope (S00's bottom ring cuts
    // the buttocks' underside, where a station step moves the surface far
    // inward and the lower-buttock contour falls tens of mm to the fold).
    // This reparametrizes the same C2 continuation; the band still leaves the
    // ring tangent to S00.
    const travelNodes: number[] = Array.from({ length: 65 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 64);
    const travel: Spline = spline(
      travelNodes,
      travelNodes.map((c: number): Vec3 => {
        const q: readonly number[] = input.leg.jet(D, phase(c)).p;
        return [Math.hypot(q[0]! - loopJet(c)[0][0], q[1]! - loopJet(c)[0][1], q[2]! - loopJet(c)[0][2]), 0, 0];
      }),
    );
    const gauge: (c: number) => [number, number, number] = (c: number): [number, number, number] => {
      const x: number = wrap(c);
      const [t0, t1, t2]: [Vec3, Vec3, Vec3] = travel(x);
      const T: number = t0[0];
      const T1: number = t1[0];
      const T2: number = t2[0];
      if (x > Math.PI) return [T, T1, T2];
      const [a, a1, a2]: [Vec3, Vec3, Vec3] = A(x);
      const n: number = Math.hypot(...a);
      const n1: number = dot(a, a1) / n;
      const n2: number = (dot(a1, a1) + dot(a, a2)) / n - (dot(a, a1) * dot(a, a1)) / (n * n * n);
      return [T / n, T1 / n - (T * n1) / (n * n), T2 / n - (2 * T1 * n1) / (n * n) - (T * n2) / (n * n) + (2 * T * n1 * n1) / (n * n * n)];
    };
    const parentMap: IAutoMovieConstructionKnownPortSource.IMap = {
      domain: [0, 2 * Math.PI],
      transverse: [0, 1],
      point: (c: number, v: number): [number, number] => [v * gauge(c)[0], c],
      jet: (c: number, v: number): IMapJet => {
        const [g, g1, g2]: [number, number, number] = gauge(c);
        return { p: [v * g, c], u: [v * g1, 1], v: [g, 0], uu: [v * g2, 0], uv: [g1, 0], vv: [0, 0] };
      },
    };
    const childMap: IAutoMovieConstructionKnownPortSource.IMap = {
      domain: [0, 2 * Math.PI],
      transverse: [0, 1],
      point: (c: number, v: number): [number, number] => [v * D, phase(c)],
      jet: (c: number, v: number): IMapJet => {
        const [, p1, p2]: [number, number, number] = angle(c);
        return { p: [v * D, phase(c)], u: [0, p1], v: [D, 0], uu: [0, p2], uv: [0, 0], vv: [0, 0] };
      },
    };
    const make: (orientation: 1 | -1) => IAutoMovieSolidSurface = (orientation: 1 | -1): IAutoMovieSolidSurface =>
      input.crease !== undefined
        ? AutoMovieHumanLegHipBand.create({ name: `band.hip.${input.side}`, parent: { field: root, map: parentMap }, child: { field: input.leg, map: childMap }, apex: input.crease.apex, transition: input.crease.transition, orientation })
        :
      AutoMovieConstructionKnownPort({
        definition: {
          name: `band.hip.${input.side}`,
          domain: [0, 2 * Math.PI],
          period: 2 * Math.PI,
          orientation,
          parent: { field: "root", map: "root", boundary: `trunk.split.${input.side}`, material: "trunk", binding: "trunk" },
          child: { field: "leg", map: "leg", boundary: `leg.${input.side}.rail`, material: `leg.${input.side}`, binding: `leg.${input.side}` },
        },
        fields: new Map<string, IAutoMovieSolidSurface>([
          ["root", root],
          ["leg", input.leg],
        ]),
        maps: new Map<string, IAutoMovieConstructionKnownPortSource.IMap>([
          ["root", parentMap],
          ["leg", childMap],
        ]),
      });
    let band: IAutoMovieSolidSurface | null = null;
    try {
      // Orientation: clock-cross-transverse outward, read at the lateral middle of the band.
      const probe: IAutoMovieSolidSurface = make(1);
      const j: IJet = probe.jet(0.5, Math.PI / 2);
      const centre: Vec3 = input.axis.at(D / 2).origin;
      const outward: number = dot(cross(vec(j.v), vec(j.u)), sub(vec(j.p), centre));
      band = outward > 0 ? probe : make(-1);
    } catch (error: unknown) {
      diagnostics.push(`hip band refused: ${error instanceof Error ? error.message : String(error)}`);
    }
    return { band, root, loop: (c: number): Vec3 => loopJet(c)[0], phase, depth: D, diagnostics };
  }

  /** A vector natural cubic spline: value, first and second derivative at a parameter. */
  type Spline = (x: number) => [Vec3, Vec3, Vec3];

  /** Natural cubic spline through vector values at increasing knots (componentwise; clamped outside). */
  function spline(xs: number[], ys: Vec3[]): Spline {
    const n: number = xs.length;
    const second: number[][] = [0, 1, 2].map((k: number): number[] => {
      const y: number[] = ys.map((p: Vec3): number => p[k]);
      const m: number[] = new Array<number>(n).fill(0);
      const a: number[] = new Array<number>(n).fill(0);
      const b: number[] = new Array<number>(n).fill(0);
      const c: number[] = new Array<number>(n).fill(0);
      const d: number[] = new Array<number>(n).fill(0);
      b[0] = 1;
      b[n - 1] = 1;
      for (let i: number = 1; i < n - 1; ++i) {
        const h0: number = xs[i]! - xs[i - 1]!;
        const h1: number = xs[i + 1]! - xs[i]!;
        a[i] = h0 / 6;
        b[i] = (h0 + h1) / 3;
        c[i] = h1 / 6;
        d[i] = (y[i + 1]! - y[i]!) / h1 - (y[i]! - y[i - 1]!) / h0;
      }
      // Thomas algorithm.
      for (let i: number = 1; i < n; ++i) {
        const w: number = a[i]! / b[i - 1]!;
        b[i] = b[i]! - w * c[i - 1]!;
        d[i] = d[i]! - w * d[i - 1]!;
      }
      m[n - 1] = d[n - 1]! / b[n - 1]!;
      for (let i: number = n - 2; i >= 0; --i) m[i] = (d[i]! - c[i]! * m[i + 1]!) / b[i]!;
      return m;
    });
    return (x0: number): [Vec3, Vec3, Vec3] => {
      const x: number = Math.min(xs[n - 1]!, Math.max(xs[0]!, x0));
      let i: number = 0;
      while (i < n - 2 && x > xs[i + 1]!) ++i;
      const h: number = xs[i + 1]! - xs[i]!;
      const t: number = x - xs[i]!;
      const u: number = xs[i + 1]! - x;
      const out: [Vec3, Vec3, Vec3] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let k: number = 0; k < 3; ++k) {
        const m0: number = second[k]![i]!;
        const m1: number = second[k]![i + 1]!;
        const y0: number = ys[i]![k];
        const y1: number = ys[i + 1]![k];
        out[0][k] = (m0 * u * u * u) / (6 * h) + (m1 * t * t * t) / (6 * h) + (y0 / h - (m0 * h) / 6) * u + (y1 / h - (m1 * h) / 6) * t;
        out[1][k] = (-m0 * u * u) / (2 * h) + (m1 * t * t) / (2 * h) - (y0 / h - (m0 * h) / 6) + (y1 / h - (m1 * h) / 6);
        out[2][k] = (m0 * u) / h + (m1 * t) / h;
      }
      return out;
    };
  }

  /** The clock wrapped into [0, 2 pi). */
  function wrap(c: number): number {
    const p: number = 2 * Math.PI;
    return ((c % p) + p) % p;
  }
}

function vec(a: readonly number[]): Vec3 {
  return [a[0]!, a[1]!, a[2]!];
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
