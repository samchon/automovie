import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionSkinCut,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** World point or direction, mm. */
type Vec3 = AutoMovieVector3Tuple;
const { dot } = AutoMovieSolidVector;

/**
 * A face's skin cut by a surface fixed in space: the curve `u = rho(v)` on the face's chart along which the skin enters the region a set
 * of planes keeps, read with the two derivatives a band's edge needs (`IAutoMovieConstructionSplit.ICut`).
 *
 * The region is `G(x) >= 0`, `G` the minimum of the planes' signed distances `g_i(x) = n_i . (x - q_i)`, or with a rounding length
 * `r` their smooth minimum `-r ln(sum_i exp(-g_i / r))`, which lies below the minimum by at most `r ln(planes)` and has the gradient
 * `sum_i w_i n_i`, `w_i = exp(-g_i / r) / sum`, and the Hessian `-(sum_i w_i n_i n_i^T - grad grad^T) / r`. On the skin `S(u, v)` the
 * residual is `F(u, v) = G(S(u, v))`; the rail's station at a phase is the first root of `F` in `u` from the end that faces the band,
 * and by the implicit function theorem `rho' = -F_v / F_u` and `rho'' = -(F_vv + 2 F_uv rho' + F_uu rho'^2) / F_u`, every term the chain
 * rule on the skin's own 2-jet, so no derivative is differenced.
 */
export namespace AutoMovieConstructionSkinCut {
  /**
   * Build a cut, or the reason it cannot be built.
   *
   * At each of `samples` phases the residual is read along the face's own stations from the end that faces the band; the first station
   * at which it turns positive brackets the root, found by bisection to the last bit. A reading at any phase starts Newton's iteration
   * from the two nearest admitted roots joined linearly and falls back to that bracketing when the iteration leaves the domain or does
   * not settle, so a reading depends on its phase alone.
   *
   * @param input The skin, the planes and the sampling.
   * @returns The cut, or the refusal naming the phase.
   */
  export function create(input: IAutoMovieConstructionSkinCut.IInput): IAutoMovieConstructionSkinCut.ICut | string {
    const { surface, planes, into }: IAutoMovieConstructionSkinCut.IInput = input;
    const turn: number = 2 * Math.PI;
    const m: number = input.samples;
    if (planes.length === 0) return "the cut has no plane";
    if (!(Number.isInteger(m) && m >= 8)) return `the cut's ${m} samples are fewer than 8`;
    const ordered: number[] =
      into === 1 ? [...input.stations] : [...input.stations].reverse();
    if (ordered.length < 2) return "the face has fewer than two stations";
    const [low, high]: [number, number] = [
      Math.min(ordered[0]!, ordered[ordered.length - 1]!),
      Math.max(ordered[0]!, ordered[ordered.length - 1]!),
    ];
    const round: number | undefined = input.round;

    /** A plane's signed distance to an actual skin point. */
    const distance = (plane: IAutoMovieConstructionSkinCut.IPlane, p: readonly number[]): number =>
      plane.normal[0] * (p[0]! - plane.point[0]) +
      plane.normal[1] * (p[1]! - plane.point[1]) +
      plane.normal[2] * (p[2]! - plane.point[2]);

    /** The region's function at a point with each plane's weight in its gradient. */
    const field = (p: readonly number[]): { value: number; weights: number[] } => {
      const g: number[] = planes.map((plane): number => distance(plane, p));
      const least: number = Math.min(...g);
      if (round === undefined) {
        const first: number = g.indexOf(least);
        return { value: least, weights: g.map((_: number, i: number): number => (i === first ? 1 : 0)) };
      }
      const e: number[] = g.map((x: number): number => Math.exp(-(x - least) / round));
      const sum: number = e.reduce((a: number, b: number): number => a + b, 0);
      return { value: least - round * Math.log(sum), weights: e.map((x: number): number => x / sum) };
    };
    /** The same region, evaluated without derivative weights on the sign path. */
    const signed = (p: Vec3): number =>
      round === undefined
        ? Math.min(...planes.map((plane): number => distance(plane, p)))
        : field(p).value;
    const point = (u: number, psi: number): Vec3 =>
      surface.point?.(u, psi) ?? surface.jet(u, psi).p;
    const fixed: ((psi: number) => Vec3)[] = ordered.map(
      (u): ((psi: number) => Vec3) =>
        surface.pointAt?.(u) ?? ((psi: number): Vec3 => point(u, psi)),
    );
    const residual = (u: number, psi: number): number => signed(point(u, psi));

    /** The source jet and first differential of the plane field at a chart point. */
    const sample = (
      u: number,
      psi: number,
    ): {
      jet: IAutoMovieSolidSurface.IJet;
      F: number;
      Fu: number;
      gradient: Vec3;
      weights: number[];
    } => {
      const j: IAutoMovieSolidSurface.IJet = surface.jet(u, psi);
      const { value, weights }: { value: number; weights: number[] } = field(j.p);
      let grad: Vec3 = [0, 0, 0];
      planes.forEach((plane: IAutoMovieConstructionSkinCut.IPlane, i: number): void => {
        grad = [
          grad[0] + weights[i]! * plane.normal[0],
          grad[1] + weights[i]! * plane.normal[1],
          grad[2] + weights[i]! * plane.normal[2],
        ];
      });
      return { jet: j, F: value, Fu: dot(grad, j.u), gradient: grad, weights };
    };

    /** The first root from the facing end by the stations' bracket and bisection, or why there is none. */
    const bracketed = (psi: number): number | string => {
      let before: number = ordered[0]!;
      if (!(signed(fixed[0]!(psi)) < 0))
        return `at phase ${psi} rad the skin is already inside the cut at the end that faces the band`;
      for (let i: number = 1; i < ordered.length; ++i) {
        const here: number = ordered[i]!;
        if (signed(fixed[i]!(psi)) > 0) {
          let [lo, hi]: [number, number] = [before, here];
          for (let step: number = 0; step < 200; ++step) {
            const mid: number = (lo + hi) / 2;
            if (mid === lo || mid === hi) break;
            if (residual(mid, psi) > 0) hi = mid;
            else lo = mid;
          }
          return hi;
        }
        before = here;
      }
      return `at phase ${psi} rad the skin never enters the cut inside its domain [${low}, ${high}] mm`;
    };

    // The admitted roots at the sample phases.
    const table: number[] = [];
    for (let k: number = 0; k < m; ++k) {
      const psi: number = (turn * k) / m;
      const root: number | string = bracketed(psi);
      if (typeof root === "string") return root;
      if (!(into * sample(root, psi).Fu > 0))
        return `at phase ${psi} rad the skin is tangent to the cut`;
      table.push(root);
    }

    /** The root at any phase: Newton from the admitted roots, else the bracket. */
    const solve = (psi: number): number => {
      const x: number = (((psi % turn) + turn) % turn) * (m / turn);
      const k: number = Math.min(m - 1, Math.floor(x));
      const f: number = x - k;
      let u: number = table[k]! * (1 - f) + table[(k + 1) % m]! * f;
      for (let step: number = 0; step < 24; ++step) {
        const { F, Fu }: ReturnType<typeof sample> = sample(u, psi);
        if (!(into * Fu > 0)) break;
        const next: number = u - F / Fu;
        if (!(next >= low && next <= high)) break;
        if (Math.abs(next - u) <= 4 * Number.EPSILON * Math.max(1, Math.abs(u))) return next;
        u = next;
      }
      const root: number | string = bracketed(psi);
      if (typeof root === "string") throw new AutoMovieLoftAdmissionError(`${surface.name}'s cut: ${root}`);
      return root;
    };
    /** Keep the same exact root and transversality check for both readers. */
    const crossing = (psi: number): { u: number; read: ReturnType<typeof sample> } => {
      const u: number = solve(psi);
      const read: ReturnType<typeof sample> = sample(u, psi);
      if (!(into * read.Fu > 0))
        throw new AutoMovieLoftAdmissionError(`${surface.name}'s cut: at phase ${psi} rad the skin is tangent to the cut`);
      return { u, read };
    };
    return {
      reach: [Math.min(...table), Math.max(...table)],
      point: (psi: number): Vec3 => crossing(psi).read.jet.p,
      at: (psi: number): [number, number, number] => {
        const { u, read }: ReturnType<typeof crossing> = crossing(psi);
        const { jet, Fu, gradient, weights }: ReturnType<typeof sample> = read;
        const Q = (a: Vec3, b: Vec3): number => {
          if (round === undefined) return 0;
          let sum: number = 0;
          planes.forEach((plane: IAutoMovieConstructionSkinCut.IPlane, i: number): void => {
            sum += weights[i]! * dot(plane.normal, a) * dot(plane.normal, b);
          });
          return -(sum - dot(gradient, a) * dot(gradient, b)) / round;
        };
        const Fuu: number = Q(jet.u, jet.u) + dot(gradient, jet.uu);
        const Fuv: number = Q(jet.u, jet.v) + dot(gradient, jet.uv);
        const Fvv: number = Q(jet.v, jet.v) + dot(gradient, jet.vv);
        const first: number = -dot(gradient, jet.v) / Fu;
        return [u, first, -(Fvv + 2 * Fuv * first + Fuu * first * first) / Fu];
      },
    };
  }
}
