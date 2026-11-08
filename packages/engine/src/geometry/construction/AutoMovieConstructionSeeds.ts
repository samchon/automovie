import type { AutoMovieConstructionSeed } from "@automovie/interface";

import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidFoot } from "./AutoMovieSolidFoot";
import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
const { norm, scale, solve3, sub } = AutoMovieSolidVector;

/**
 * A join's seed record as the trace's seed (`AutoMovieSolidIntersection.IInput.seed`), in millimetres.
 *
 * A point seed is its two chart points. A search seed walks the part face's station line at its phase between its two shares, takes each step's foot on the host face and solves `P(s, phase) = H(y, theta)` for `(s, y, theta)` by safeguarded Newton. The first locally converged meeting inside the part shares and the actual host domain is the seed. This bounded local search does not certify every crossing or geometric absence.
 *
 * @evidence contracts/common.md#principled-implementation A search uses Armijo-backtracked Newton meeting solves on one fixed-phase part line from endpoint/interior-layer starts, accepting the original mm residual only inside the part shares and actual host domain. This does not prove exhaustive intersection discovery.
 * @evidence contracts/common.md#clear-and-simple-design Point conversion is direct; search delegates bounded foot refinement and the three-unknown meeting solve. A valid coarse chart remains a Newton initializer when no interior normal foot exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The phase stays fixed and every jet trial is admitted before evaluation. No point/source is clamped, no sampled point replaces a meeting, and bounded failure is not proof of no crossing. The complete traced loop retains its own checks.
 * @evidence contracts/common.md#meaningful-documentation States both seed kinds, the walk, its steps, the solve and the failure message.
 * @evidence contracts/performance.md#efficient-algorithms Each endpoint/interior-layer candidate has at most one 544-point grid, two 60-step foot attempts and one meeting solve with at most 40 Newton updates and 20 trials per update. Surface callback cost remains part of that bounded work.
 * @evidence contracts/performance.md#reuse-equivalent-work A successful foot warm-starts the next candidate; a failed cold start is not repeated. Accepted trial jets and residuals supply the next Newton update, while each different cold candidate can still rebuild its grid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds O(L) interior/candidate station arrays plus local guesses/iterates for L layers; only a seed record or error string escapes and no cache is retained.
 */
export namespace AutoMovieConstructionSeeds {
  /** Newton steps of one meeting solve. */
  export const STEPS: number = 40;

  /** Stations and phases of the coarse grid a step's first foot starts from. */
  export const GRID: [number, number] = [16, 32];

  /** Twenty trial steps, starting at full weight, bound local safeguarding work; exhaustion is not a global absence result. */
  const BACKTRACKINGS: number = 20;

  /** Conventional Armijo sufficient-decrease factor, matching PETSc SNESLINESEARCHBT's documented default rather than an anatomical fit. */
  const DECREASE: number = 1e-4;

  /**
   * The trace's seed.
   *
   * @param seed The seed record, metres.
   * @param part The part face's surface.
   * @param layers The part chain's layer stations, mm, increasing.
   * @param host The host face's surface.
   * @param face The host face's index in the host atlas.
   * @param tolerance Largest gap accepted at the meeting, mm.
   * @returns The seed, or the premise the search broke.
   *
   * Point mode converts chart lengths without checking a meeting. Search
   * mode is a finite local search; its failure names nonconvergence or
   * inadmissible meetings rather than certifying absence of every crossing.
   *
   * @evidence contracts/common.md#principled-implementation Converts point stations from metres to mm or tries fixed-phase Armijo-Newton meetings from share endpoints/interior layers, accepting the original residual tolerance, part share interval and actual host.domain.
   * @evidence contracts/common.md#clear-and-simple-design One seed-kind dispatch preserves point authoring, candidate/warm/cold order and the first accepted local meeting. Foot failure does not suppress a joint meeting from the existing admitted coarse chart.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Search never substitutes a sampled point for a meeting: coarse/foot charts only initialize the actual residual solve. Infeasible jets leave later candidates available, no source is clamped and bounded failure is not a no-intersection proof.
   * @evidence contracts/common.md#meaningful-documentation Search shares use the actual face domain, including explicitly retained original caps; absent domain retains supplied layer bounds. Gives metre input, mm surface/layer/tolerance units, point-mode meaning and bounded local failure.
   * @evidence contracts/performance.md#efficient-algorithms For M<=L+2 candidates, work is O(L+M*(G+2F+N*B)) callback/constant-system steps, G=544 grid points, F=60 foot steps, N=40 Newton updates and B=20 trials, plus one initial meeting jet pair. No complete source or surface sampling is introduced.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the last successful foot as the next chart guess and retains one accepted meeting jet pair/residual between updates. A distinct cold fallback follows only a failed warm guess; no grid, source or effect is cached across requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Interior/ordered station arrays and current numerical jets have call lifetime; only the selected seed's chart scalars/face index or error string is returned.
   */
  export function create(
    seed: AutoMovieConstructionSeed,
    part: IAutoMovieSolidSurface,
    layers: readonly number[],
    host: IAutoMovieSolidSurface,
    face: number,
    tolerance: number,
  ): AutoMovieSolidIntersection.IInput["seed"] | string {
    const S: number = AutoMovieConstructionViews.SCALE;
    if (seed.type === "point")
      return {
        phi: seed.part[1],
        s: seed.part[0] * S,
        y: seed.host[0] * S,
        theta: seed.host[1],
        face,
      };
    if (
      !(
        seed.from >= 0 &&
        seed.from <= 1 &&
        seed.to >= 0 &&
        seed.to <= 1 &&
        seed.from !== seed.to
      )
    )
      return `search shares ${seed.from} and ${seed.to} must lie in [0, 1] and differ`;
    const [first, last]: readonly [number, number] = part.domain ?? [
      layers[0]!,
      layers[layers.length - 1]!,
    ];
    const a: number = first + seed.from * (last - first);
    const b: number = first + seed.to * (last - first);
    const low: number = Math.min(a, b);
    const high: number = Math.max(a, b);
    const inside: number[] = layers.filter(
      (s: number): boolean => s > low && s < high,
    );
    const steps: number[] =
      a < b ? [a, ...inside, b] : [a, ...inside.reverse(), b];

    let guess: [number, number] | null = null;
    for (const s of steps) {
      const at: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
        part,
        s,
        seed.phase,
      );
      if (at === null) continue;
      const p: Vec3 = at.p;
      const start: [number, number] = guess ?? nearest(host, p);
      let initial: [number, number] = start;
      let foot: AutoMovieSolidFoot.IFoot | null = AutoMovieSolidFoot.of(
        host,
        p,
        start,
        tolerance,
      );
      if (foot === null && guess !== null) {
        const cold: [number, number] = nearest(host, p);
        initial = cold;
        if (cold[0] !== start[0] || cold[1] !== start[1])
          foot = AutoMovieSolidFoot.of(host, p, cold, tolerance);
      }
      if (foot !== null) guess = [foot.u, foot.v];
      const chart: [number, number] =
        foot === null ? initial : [foot.u, foot.v];
      const met: Vec3 | null = meet(
        part,
        host,
        seed.phase,
        [s, chart[0], chart[1]],
        tolerance,
      );
      const domain: [number, number] | undefined = host.domain;
      if (
        met !== null &&
        met[0] >= low &&
        met[0] <= high &&
        (domain === undefined || (met[1] >= domain[0] && met[1] <= domain[1]))
      )
        return { phi: seed.phase, s: met[0], y: met[1], theta: met[2], face };
    }
    return `no admissible meeting converged from ${steps.length} local starts on the part's station line at phase ${seed.phase} between stations ${a} and ${b} mm; this bounded search does not prove no crossing`;
  }

  /**
   * Armijo-Newton on the original physical residual P(s,phase)-H(y,theta).
   *
   * For the exact Newton direction, the directional derivative of |F|^2/2 is -|F|^2. The equivalent gap test avoids squaring mm residuals: gapTrial <= gap*sqrt(1-2*c*alpha). Halving alpha keeps the geometry unchanged and follows the sufficient-decrease policy documented at https://petsc.org/release/manualpages/SNES/SNESLINESEARCHBT/. Forty updates and twenty trials per update are finite work limits, not a convergence certificate. Current and accepted trial jets are used before another query of their producer, and only constant-size local state survives between updates.
   */
  function meet(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidSurface,
    phase: number,
    x0: Vec3,
    tolerance: number,
  ): Vec3 | null {
    let x: Vec3 = [...x0];
    if (!x.every(Number.isFinite)) return null;
    const p0: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
      part,
      x[0],
      phase,
    );
    const h0: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
      host,
      x[1],
      x[2],
    );
    if (p0 === null || h0 === null) return null;
    let p: IAutoMovieSolidSurface.IJet = p0;
    let h: IAutoMovieSolidSurface.IJet = h0;
    let f: Vec3 = sub(p.p, h.p);
    let gap: number = norm(f);
    if (!Number.isFinite(gap)) return null;
    for (let k: number = 0; k < STEPS; k++) {
      if (gap <= tolerance) return x;
      const dx: Vec3 | null = solve3(
        p.u,
        scale(h.u, -1),
        scale(h.v, -1),
        scale(f, -1),
      );
      if (dx === null || !dx.every(Number.isFinite)) return null;
      let weight: number = 1;
      let moved: boolean = false;
      for (let trial: number = 0; trial < BACKTRACKINGS; trial++, weight /= 2) {
        const next: Vec3 = [
          x[0] + weight * dx[0],
          x[1] + weight * dx[1],
          x[2] + weight * dx[2],
        ];
        if (!next.every(Number.isFinite)) continue;
        const partJet: IAutoMovieSolidSurface.IJet | null =
          AutoMovieSolidDomain.jet(part, next[0], phase);
        const hostJet: IAutoMovieSolidSurface.IJet | null =
          AutoMovieSolidDomain.jet(host, next[1], next[2]);
        if (partJet === null || hostJet === null) continue;
        const residual: Vec3 = sub(partJet.p, hostJet.p);
        const distance: number = norm(residual);
        if (!(distance <= gap * Math.sqrt(1 - 2 * DECREASE * weight))) continue;
        x = next;
        p = partJet;
        h = hostJet;
        f = residual;
        gap = distance;
        moved = true;
        break;
      }
      if (!moved) return null;
    }
    return gap <= tolerance ? x : null;
  }

  /** The chart point of a coarse grid over the surface's domain nearest a world point. */
  function nearest(
    surface: IAutoMovieSolidSurface,
    p: Readonly<Vec3>,
  ): [number, number] {
    const [u0, u1]: [number, number] = surface.domain ?? [0, 1];
    const period: number = surface.period ?? 1;
    let best: [number, number] = [u0, 0];
    let distance: number = Infinity;
    for (let i: number = 0; i <= GRID[0]; i++)
      for (let j: number = 0; j < GRID[1]; j++) {
        const u: number = u0 + ((u1 - u0) * i) / GRID[0];
        const v: number = (period * j) / GRID[1];
        const at: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
          surface,
          u,
          v,
        );
        if (at === null) continue;
        const d: number = norm(sub(at.p, p));
        if (d < distance) {
          distance = d;
          best = [u, v];
        }
      }
    return best;
  }
}
