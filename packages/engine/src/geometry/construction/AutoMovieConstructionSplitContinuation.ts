import type {
  AutoMovieVector3Tuple as V3,
  IAutoMovieNaturalCubicSpline,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionPortField as Field } from "./AutoMovieConstructionPortField";
import { AutoMovieNaturalSpline as Spline } from "./AutoMovieNaturalSpline";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

type Scalars = [number, number, number];
type Address = (phase: number) => Scalars;
type SurfaceJet = IAutoMovieSolidSurface.IJet;

/**
 * Continue the original material, with the full 2-jet, across its owned rail.
 * The straightened chart reads the child only at `u = rho(phi) + t g(c)`,
 * where `g` always points to the retained side. The three reflected support
 * nodes have moments `[1, -1, 1]`, reproducing the negative direction to
 * second order while all original material reads have nonnegative station.
 *
 * @see https://doi.org/10.1215/S0012-7094-41-00812-8 Hestenes extension of a differentiable function.
 * @see https://doi.org/10.1007/PL00013398 Hartmann parametric geometric blending.
 */
export namespace AutoMovieConstructionSplitContinuation {
  /** The actual scaled column derivatives and the original rail's admitted range. */
  export interface IInput {
    /** Direction from the child rail into the child. */
    into: 1 | -1;

    /** Station range of the actual rail, millimetres. */
    reach: readonly [number, number];

    /** Starting velocities on the child surface in the normalized cross coordinate. */
    directions: readonly V3[];

    /** Clock samples on an open arc. Absent, the samples span the full turn. */
    addresses?: readonly number[];

    /** Available retained material when the source chart is already straightened. */
    room?: number;

    /** Largest original angular travel supported by the owned arc, radians. */
    angle?: number;
  }

  /** Prepare the fixed chart gains and return the reflected skin at a cross coordinate and clock. */
  export function prepare(
    child: IAutoMovieSolidSurface,
    rail: Address,
    phase: Address,
    phases: readonly number[],
    input: IInput,
  ): ((t: number, clock: number) => SurfaceJet) | string {
    const along: number[] = [];
    const across: number[] = [];
    for (const [i, psi] of phases.entries()) {
      const [s, slope]: Scalars = rail(psi);
      const jet: SurfaceJet = child.jet(s, psi);
      const u2: number = Vec.dot(jet.u, jet.u);
      const v2: number = Vec.dot(jet.v, jet.v);
      const mixed: number = Vec.dot(jet.u, jet.v);
      const direction: V3 = input.directions[i]!;
      const solved: [number, number] | null = Vec.solve2(u2, mixed, mixed, v2, [Vec.dot(jet.u, direction), Vec.dot(jet.v, direction)]);
      if (solved === null) return "the child's exact continuation has a degenerate tangent plane";
      const [du, dv] = solved;
      const kept: number = input.into * (du - slope * dv);
      if (!(kept > 0 && Number.isFinite(kept))) return "the child's exact continuation points outside its retained source";
      along.push(dv);
      across.push(Math.log(kept));
    }
    const field = (values: readonly number[]): { at: Address; bounds: readonly [number, number] } => {
      if (input.addresses === undefined) {
        const circle = Field.periodic(values);
        return { at: circle.at, bounds: circle.bounds };
      }
      const xs: readonly number[] = input.addresses;
      const cubic: IAutoMovieNaturalCubicSpline = Spline.create(xs, values);
      const at = (c: number): Scalars => Spline.read(cubic, c);
      const slopes: number[] = xs.map((c): number => at(c)[1]);
      // Cubic Bézier controls of each span enclose the complete field.
      const controls: number[] = xs.slice(1).flatMap((x, i): number[] => {
        const span: number = x - xs[i]!;
        return [values[i]!, values[i]! + span * slopes[i]! / 3,
          values[i + 1]! - span * slopes[i + 1]! / 3, values[i + 1]!];
      });
      return { at, bounds: [Math.min(...controls), Math.max(...controls)] };
    };
    const gain = field(across);
    const clock = field(along);
    const room: number = input.room ?? (child.domain === undefined ? Infinity : input.into > 0
      ? child.domain[1] - input.reach[1]
      : input.reach[0] - child.domain[0]);
    const angle: number = input.angle ?? Infinity;
    const largestClock: number = Math.max(Math.abs(clock.bounds[0]), Math.abs(clock.bounds[1]));
    const radius: number = Math.min(room / Math.exp(gain.bounds[1]), largestClock > 0 ? angle / largestClock : Infinity);
    if (!(radius > 0)) return "the child's exact continuation has no retained station interval";

    return (t: number, c: number): SurfaceJet => {
      const [chi, chi1, chi2]: Scalars = phase(c);
      const [v0, v1, v2]: Scalars = clock.at(c);
      const [log, g1, g2]: Scalars = gain.at(c);
      const g: number = input.into * Math.exp(log);
      const read = (w: number): SurfaceJet => {
        const v: number = chi + w * v0;
        const [rho, first, second]: Scalars = rail(v);
        const j: SurfaceJet = child.jet(rho + w * g, v);
        const vc: number = chi1 + w * v1;
        const vcc: number = chi2 + w * v2;
        const uw: number = first * v0 + g;
        const uc: number = first * vc + w * g * g1;
        const J = (a: number, b: number): V3 => Vec.combine([[a, j.u], [b, j.v]]);
        const H = (a: number, b: number, x: number, y: number): V3 =>
          Vec.combine([[a * x, j.uu], [a * y + b * x, j.uv], [b * y, j.vv]]);
        return {
          p: j.p,
          u: J(uw, v0),
          v: J(uc, vc),
          uu: Vec.add(H(uw, v0, uw, v0), J(second * v0 * v0, 0)),
          uv: Vec.add(H(uw, v0, uc, vc), J(second * v0 * vc + first * v1 + g * g1, v1)),
          vv: Vec.add(H(uc, vc, uc, vc), J(second * vc * vc + first * vcc + w * g * (g2 + g1 * g1), vcc)),
        };
      };
      if (t === 0) {
        const edge: SurfaceJet = read(0);
        return { ...edge, u: Vec.scale(edge.u, -1), uv: Vec.scale(edge.uv, -1) };
      }
      // The rational chart parameter is the identity through order two at
      // zero. It stays inside both the available retained stations and the
      // available angular range of the original arc.
      const r2: number = (t / radius) ** 2;
      const w: number = t / Math.sqrt(1 + r2);
      const d1: number = (1 + r2) ** -1.5;
      const d2: number = -3 * t / (radius * radius) * (1 + r2) ** -2.5;
      const a: SurfaceJet = read(0);
      const b: SurfaceJet = read(w / 2);
      const z: SurfaceJet = read(w);
      const combine = (key: keyof SurfaceJet): V3 => Vec.combine([[6, a[key]], [-8, b[key]], [3, z[key]]]);
      const slope: V3 = Vec.combine([[-4, b.u], [3, z.u]]);
      return {
        p: combine("p"),
        u: Vec.scale(slope, d1),
        v: combine("v"),
        uu: Vec.combine([[d2, slope], [-2 * d1 * d1, b.uu], [3 * d1 * d1, z.uu]]),
        uv: Vec.combine([[-4 * d1, b.uv], [3 * d1, z.uv]]),
        vv: combine("vv"),
      };
    };
  }
}
