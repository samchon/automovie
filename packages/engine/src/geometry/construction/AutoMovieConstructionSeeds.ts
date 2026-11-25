import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionSeed,
  IAutoMovieConstructionSeedTrace,
  IAutoMovieSolidFoot,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionSeedTrace as Trace } from "./AutoMovieConstructionSeedTrace";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidFoot } from "./AutoMovieSolidFoot";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

type Vec3 = AutoMovieVector3Tuple;
const { norm, scale, solve3, sub } = AutoMovieSolidVector;

/**
 * A join's seed record as the trace's seed
 * (`IAutoMovieSolidIntersection.IInput.seed`), in millimetres.
 *
 * A point seed is its two chart points. A search seed walks the part face's
 * station line at its phase (or, with `phases`, each of that many lines round
 * the part in turn, its phase's first) between its two shares, takes each
 * step's foot on the host face and solves `P(s, phase) = H(y, theta)` for `(s,
 * y, theta)` by safeguarded Newton. The first locally converged meeting inside
 * the part shares and the actual host domain, on the first line that has one,
 * is the seed, with that line's phase. This bounded local search does not
 * certify every crossing or geometric absence.
 */
export namespace AutoMovieConstructionSeeds {
  /** Newton steps of one meeting solve. */
  export const STEPS: number = 40;

  /** Stations and phases of the coarse grid a step's first foot starts from. */
  export const GRID: [number, number] = [16, 32];

  /**
   * Twenty trial steps, starting at full weight, bound local safeguarding work;
   * exhaustion is not a global absence result.
   */
  const BACKTRACKINGS: number = 20;

  /**
   * Conventional Armijo sufficient-decrease factor, matching PETSc
   * SNESLINESEARCHBT's documented default rather than an anatomical fit.
   */
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
   * @param trace Optional nonthrowing observer of detached actual
   *   candidate/Newton states; absent, no snapshots are made.
   * @returns The seed, or the premise the search broke.
   *
   *   Point mode converts chart lengths without checking a meeting. Search mode
   *   is a finite local search over one station line, or `phases` lines round
   *   the part in a fixed order; its failure names nonconvergence or
   *   inadmissible meetings rather than certifying absence of every crossing.
   */
  export function create(
    seed: IAutoMovieConstructionSeed,
    part: IAutoMovieSolidSurface,
    layers: readonly number[],
    host: IAutoMovieSolidSurface,
    face: number,
    tolerance: number,
    trace?: IAutoMovieConstructionSeedTrace.Sink,
  ): IAutoMovieSolidIntersection.IInput["seed"] | string {
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
    const lines: number = seed.phases ?? 1;
    if (!(lines >= 1))
      return `search line count ${seed.phases} must be a positive integer`;
    // The lines round the part in a fixed order, the declared phase's first; the first line with an admitted meeting is the seed.
    const phases: number[] = Array.from(
      { length: lines },
      (_: unknown, k: number): number => seed.phase + (2 * Math.PI * k) / lines,
    );
    const [first, last]: readonly [number, number] = part.domain ?? [
      layers[0]!,
      layers[layers.length - 1]!,
    ];
    const a: number = first + seed.from * (last - first);
    const b: number = first + seed.to * (last - first);
    let starts: number = 0;
    for (const phase of phases) {
      const found: IAutoMovieSolidIntersection.IInput["seed"] | number = along(
        a,
        b,
        phase,
        part,
        layers,
        host,
        face,
        tolerance,
        trace,
      );
      if (typeof found !== "number") return found;
      starts = found;
    }
    return lines === 1
      ? `no admissible meeting converged from ${starts} local starts on the part's station line at phase ${seed.phase} between stations ${a} and ${b} mm; this bounded search does not prove no crossing`
      : `no admissible meeting converged from ${starts} local starts on each of the part's ${lines} station lines at phases ${phases.map((p: number): string => p.toFixed(4)).join(", ")} between stations ${a} and ${b} mm; this bounded search does not prove no crossing`;
  }

  /**
   * One station line's search: the walk at `phase` from station `a` to station
   * `b`, mm, one step per layer between them, each step's foot on the host and
   * the meeting solved from it.
   *
   * @returns The first admitted meeting, with `phase` as its phase, or the
   *   number of local starts tried when none was admitted.
   */
  function along(
    a: number,
    b: number,
    phase: number,
    part: IAutoMovieSolidSurface,
    layers: readonly number[],
    host: IAutoMovieSolidSurface,
    face: number,
    tolerance: number,
    trace?: IAutoMovieConstructionSeedTrace.Sink,
  ): IAutoMovieSolidIntersection.IInput["seed"] | number {
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
        phase,
      );
      if (at === null) continue;
      const p: Vec3 = at.p;
      const start: [number, number] = guess ?? nearest(host, p);
      let initialMode: "warm-foot" | "cold-foot" | "coarse" =
        guess === null ? "cold-foot" : "warm-foot";
      let initial: [number, number] = start;
      let foot: IAutoMovieSolidFoot.IFoot | null = AutoMovieSolidFoot.of(
        host,
        p,
        start,
        tolerance,
      );
      if (foot === null && guess !== null) {
        const cold: [number, number] = nearest(host, p);
        initial = cold;
        initialMode = "cold-foot";
        if (cold[0] !== start[0] || cold[1] !== start[1])
          foot = AutoMovieSolidFoot.of(host, p, cold, tolerance);
      }
      if (foot !== null) guess = [foot.u, foot.v];
      const chart: [number, number] =
        foot === null ? initial : [foot.u, foot.v];
      if (trace !== undefined)
        Trace.emit(trace, {
          kind: "candidate",
          phase,
          start: s,
          chart: [s, chart[0], chart[1]],
          gap: null,
          iteration: 0,
          reason: "start",
          initial: foot === null ? "coarse" : initialMode,
        });
      const met: Vec3 | null = meet(
        part,
        host,
        phase,
        [s, chart[0], chart[1]],
        tolerance,
        trace,
      );
      const domain: [number, number] | undefined = host.domain;
      if (
        met !== null &&
        met[0] >= low &&
        met[0] <= high &&
        (domain === undefined || (met[1] >= domain[0] && met[1] <= domain[1]))
      ) {
        if (trace !== undefined)
          Trace.emit(trace, {
            kind: "candidate",
            phase,
            start: s,
            chart: [...met],
            gap: null,
            iteration: null,
            reason: "converged",
          });
        return { phi: phase, s: met[0], y: met[1], theta: met[2], face };
      }
      if (trace !== undefined)
        Trace.emit(trace, {
          kind: "candidate",
          phase,
          start: s,
          chart: met === null ? null : [...met],
          gap: null,
          iteration: null,
          reason: met === null ? "candidate-failed" : "outside-admission",
        });
    }
    return steps.length;
  }

  /**
   * Armijo-Newton on the original physical residual P(s,phase)-H(y,theta).
   *
   * For the exact Newton direction, the directional derivative of |F|^2/2 is
   * -|F|^2. The equivalent gap test avoids squaring mm residuals: gapTrial <=
   * gap_sqrt(1-2_c*alpha). Halving alpha keeps the geometry unchanged and
   * follows the sufficient-decrease policy documented at
   * https://petsc.org/release/manualpages/SNES/SNESLINESEARCHBT/. Forty updates
   * and twenty trials per update are finite work limits, not a convergence
   * certificate. Current and accepted trial jets are used before another query
   * of their producer, and only constant-size local state survives between
   * updates.
   */
  function meet(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidSurface,
    phase: number,
    x0: Vec3,
    tolerance: number,
    trace?: IAutoMovieConstructionSeedTrace.Sink,
  ): Vec3 | null {
    let x: Vec3 = [...x0];
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
    if (p0 === null || h0 === null) {
      if (trace !== undefined)
        Trace.emit(trace, {
          kind: "meet-end",
          phase,
          start: x0[0],
          chart: x,
          gap: null,
          iteration: 0,
          reason: "unavailable-jet",
        });
      return null;
    }
    let p: IAutoMovieSolidSurface.IJet = p0;
    let h: IAutoMovieSolidSurface.IJet = h0;
    let f: Vec3 = sub(p.p, h.p);
    let gap: number = norm(f);
    for (let k: number = 0; k < STEPS; k++) {
      if (gap <= tolerance) {
        if (trace !== undefined)
          Trace.emit(trace, {
            kind: "meet-end",
            phase,
            start: x0[0],
            chart: x,
            gap,
            iteration: k,
            reason: "converged",
          });
        return x;
      }
      const dx: Vec3 | null = solve3(
        p.u,
        scale(h.u, -1),
        scale(h.v, -1),
        scale(f, -1),
      );
      if (dx === null) {
        if (trace !== undefined)
          Trace.emit(trace, {
            kind: "meet-end",
            phase,
            start: x0[0],
            chart: x,
            gap,
            iteration: k,
            reason: dx === null ? "singular-step" : "nonfinite-step",
          });
        return null;
      }
      let weight: number = 1;
      let moved: boolean = false;
      for (let trial: number = 0; trial < BACKTRACKINGS; trial++, weight /= 2) {
        const next: Vec3 = [
          x[0] + weight * dx[0],
          x[1] + weight * dx[1],
          x[2] + weight * dx[2],
        ];
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
        if (trace !== undefined)
          Trace.emit(trace, {
            kind: "iteration",
            phase,
            start: x0[0],
            chart: x,
            gap,
            iteration: k + 1,
            reason: "accepted-step",
          });
        break;
      }
      if (!moved) {
        if (trace !== undefined)
          Trace.emit(trace, {
            kind: "meet-end",
            phase,
            start: x0[0],
            chart: x,
            gap,
            iteration: k,
            reason: "armijo-exhausted",
          });
        return null;
      }
    }
    if (trace !== undefined)
      Trace.emit(trace, {
        kind: "meet-end",
        phase,
        start: x0[0],
        chart: x,
        gap,
        iteration: STEPS,
        reason: gap <= tolerance ? "converged" : "updates-exhausted",
      });
    return gap <= tolerance ? x : null;
  }

  /**
   * The chart point of a coarse grid over the surface's domain nearest a world
   * point.
   */
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
