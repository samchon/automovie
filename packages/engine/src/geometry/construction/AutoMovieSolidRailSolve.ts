import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidRailSolve,
  IAutoMovieSolidRailSolveAtlasSection,
  IAutoMovieSolidSurface,
  IAutoMovieSolidTraceTrialTrial,
} from "@automovie/interface";

import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidTraceTrial } from "./internal/AutoMovieSolidTraceTrial";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** Existing vector arithmetic shared by both rail equations. */
const { combine, dot, norm, sub }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;

/** Local normal-section/chord rail solves on owned surface charts. */
export namespace AutoMovieSolidRailSolve {
  /**
   * Solve the host's normal section across explicitly adjacent owned charts.
   *
   * @param host Frozen host faces and their declared boundary-foot maps.
   * @param face Face supplying the original first-order guess.
   * @param start First-order rail chart guess; it is not a published point.
   * @param from Original intersection position, mm.
   * @param m Fixed normal-section plane normal.
   * @param direction Original outward unit world direction.
   * @param width Positive world chord, mm.
   * @param steps Newton iteration bound.
   * @param rounding Original relative plane/chord residual allowance.
   * @param switches Maximum accepted chart transitions.
   * @param report Filled, when given, with why a null was returned and the
   *   face, chart, residuals and remaining switches at that moment.
   * @returns One actually retained solution, or null on numerical/open-boundary
   *   failure.
   */
  export function atlas(
    host: IAutoMovieSolidAtlas,
    face: number,
    start: readonly [number, number],
    from: Readonly<AutoMovieVector3Tuple>,
    m: Readonly<AutoMovieVector3Tuple>,
    direction: Readonly<AutoMovieVector3Tuple>,
    width: number,
    steps: number,
    rounding: number,
    switches: number,
    report?: IAutoMovieSolidRailSolve.IAtlasReport,
  ): IAutoMovieSolidRailSolveAtlasSection | null {
    const visited: number[] = [face];
    const fail = (
      reason: string,
      numbers: Record<string, number> = {},
    ): null => {
      if (report !== undefined) {
        report.reason = reason;
        report.numbers = {
          ...numbers,
          ...Object.fromEntries(
            visited.map((f: number, k: number): [string, number] => [
              "visit" + k,
              f,
            ]),
          ),
        };
      }
      return null;
    };
    if (!(width > 0) || !(norm(m) > 0))
      return fail("no positive chord or no section plane");
    let left: number = switches;
    let current: IAutoMovieSolidTraceTrialTrial | null =
      AutoMovieSolidTraceTrial(host, face, start[0], start[1], left > 0);
    if (current === null)
      return fail("the start chart lies on no face", {
        face,
        startU: start[0],
        startV: start[1],
      });
    if (current.crossed) left--;
    // The face the last crossing left: a step is not taken straight back across that seam.
    let came: number | null = current.crossed ? face : null;
    const scale: number = width + norm(from);

    /** The plane-and-chord residual of an admitted trial, mm. */
    const residual = (trial: { jet: IAutoMovieSolidSurface.IJet }): number => {
      const q: AutoMovieVector3Tuple = sub(trial.jet.p, from);
      return Math.hypot(dot(q, m), (dot(q, q) - width * width) / (2 * width));
    };

    /**
     * The foot itself, or one Newton step on its face from it, halved within
     * that face's region (kept when the foot is kept), whose residual is below
     * bound; null when none is.
     */
    const onward = (
      foot: NonNullable<IAutoMovieSolidTraceTrialTrial | null>,
      bound: number,
    ): IAutoMovieSolidTraceTrialTrial | null => {
      if (residual(foot) < bound) return foot;
      const j: IAutoMovieSolidSurface.IJet = foot.jet;
      const r: AutoMovieVector3Tuple = sub(j.p, from);
      const dx: [number, number] | null = AutoMovieSolidVector.solve2(
        dot(j.u, m),
        dot(j.v, m),
        2 * dot(r, j.u),
        2 * dot(r, j.v),
        [-dot(r, m), -(dot(r, r) - width * width)],
      );
      if (dx === null) return null;
      const surface: IAutoMovieSolidSurface = host.faces[foot.face]!;
      const held: boolean = host.kept(foot.face, foot.u, foot.v);
      let k: number = 1;
      for (let trial: number = 0; trial < 20; trial++, k /= 2) {
        const [u1, v1]: [number, number] = [
          foot.u + k * dx[0],
          foot.v + k * dx[1],
        ];
        if (
          !AutoMovieSolidDomain.contains(surface, u1) ||
          (held && !host.kept(foot.face, u1, v1))
        )
          continue;
        const next: IAutoMovieSolidTraceTrialTrial | null =
          AutoMovieSolidTraceTrial(host, foot.face, u1, v1, false);
        if (next !== null && residual(next) < bound) return next;
      }
      return null;
    };
    for (let step: number = 0; step < steps; step++) {
      const j: IAutoMovieSolidSurface.IJet = current.jet;
      const r: AutoMovieVector3Tuple = sub(j.p, from);
      const f1: number = dot(r, m);
      const f2: number = dot(r, r) - width * width;
      const done: boolean =
        Math.abs(f1) <= rounding * scale &&
        Math.abs(f2) <= 2 * width * rounding * scale;
      if (visited.at(-1) !== current.face) visited.push(current.face);
      const here: Record<string, number> = {
        step,
        face: current.face,
        u: current.u,
        v: current.v,
        planeResidual: f1,
        chordResidual: f2,
        switchesLeft: left,
      };
      if (done) {
        if (host.kept(current.face, current.u, current.v)) {
          const d: [number, number] | null = project(j, direction);
          if (d !== null && report !== undefined) {
            report.reason = "solved";
            report.numbers = {
              ...here,
              ...Object.fromEntries(
                visited.map((f: number, k: number): [string, number] => [
                  "visit" + k,
                  f,
                ]),
              ),
            };
          }
          return d === null
            ? fail(
                "the outward direction does not project onto the solved face",
                here,
              )
            : {
                face: current.face,
                chart: [current.u, current.v],
                direction: d,
              };
        }
        if (left === 0)
          return fail(
            "solved on a trimmed-away part of a face with no chart switch left",
            here,
          );
        const next: ReturnType<IAutoMovieSolidAtlas["across"]> = host.across(
          current.face,
          current.u,
          current.v,
        );
        if (next === null)
          return fail(
            "solved on a trimmed-away part of a face with no neighbour across",
            here,
          );
        current = AutoMovieSolidTraceTrial(
          host,
          next.face,
          next.u,
          next.v,
          false,
        );
        if (current === null)
          return fail("the neighbour's foot lies on no face", {
            ...here,
            nextFace: next.face,
            nextU: next.u,
            nextV: next.v,
          });
        came = here.face!;
        left--;
        continue;
      }
      const dx: [number, number] | null = AutoMovieSolidVector.solve2(
        dot(j.u, m),
        dot(j.v, m),
        2 * dot(r, j.u),
        2 * dot(r, j.v),
        [-f1, -f2],
      );
      if (dx === null)
        return fail("the plane-and-chord Jacobian is singular", here);
      const merit: number = Math.hypot(f1, f2 / (2 * width));
      const lower = (trial: { jet: IAutoMovieSolidSurface.IJet }): boolean =>
        residual(trial) < merit;
      // The region a step stays in: the face's kept chart when the iterate is kept, else its owned chart. A first-order start or a mapped
      // foot can stand on a trimmed-away part of its face (the operator body test's beam starts on the column's trimmed part), and from
      // there no step is kept; it moves in the chart as before and leaves by the solved-but-not-kept crossing.
      const face0: number = current.face;
      const held: boolean = host.kept(face0, current.u, current.v);
      const inside = (u: number, v: number): boolean =>
        AutoMovieSolidDomain.contains(host.faces[face0]!, u) &&
        (!held || host.kept(face0, u, v));
      let accepted: boolean = false;
      let k: number = 1;
      for (let trial: number = 0; trial < 20; trial++, k /= 2) {
        const [u1, v1]: [number, number] = [
          current.u + k * dx[0],
          current.v + k * dx[1],
        ];
        if (!inside(u1, v1)) {
          // A projected Newton step: the step is first clipped at the face's kept boundary (bisected on the step's share), so an iterate near a
          // seam stays on its face; it crosses only when the clipped point does not lower the residual, a switch is left, and the face
          // across is not the one it just left. At a tangent seam each face's linearization overshoots onto the other, and crossing on
          // every overshoot alternated between the two faces until the switches ran out.
          let [lo, hi]: [number, number] = [0, k];
          for (
            let b: number = 0;
            b < 52 &&
            inside(current.u + hi * dx[0], current.v + hi * dx[1]) === false &&
            hi - lo > 1e-15 * k;
            b++
          ) {
            const mid: number = (lo + hi) / 2;
            if (inside(current.u + mid * dx[0], current.v + mid * dx[1]))
              lo = mid;
            else hi = mid;
          }
          if (lo > 0) {
            const clipped: IAutoMovieSolidTraceTrialTrial | null =
              AutoMovieSolidTraceTrial(
                host,
                face0,
                current.u + lo * dx[0],
                current.v + lo * dx[1],
                false,
              );
            if (clipped !== null && lower(clipped)) {
              current = clipped;
              accepted = true;
              break;
            }
          }
          if (left === 0) continue;
          // Past the domain the trial crosses at its foot; inside the domain but past the kept region (a trimmed part of the chart) the
          // neighbour across that trim is read explicitly, since the chart itself still evaluates there.
          const beyond: ReturnType<IAutoMovieSolidAtlas["across"]> =
            AutoMovieSolidDomain.contains(host.faces[face0]!, u1)
              ? host.across(face0, u1, v1)
              : null;
          const reached: IAutoMovieSolidTraceTrialTrial | null =
            beyond === null
              ? null
              : AutoMovieSolidTraceTrial(
                  host,
                  beyond.face,
                  beyond.u,
                  beyond.v,
                  false,
                );
          const crossed: IAutoMovieSolidTraceTrialTrial | null =
            reached !== null
              ? { ...reached, crossed: true }
              : AutoMovieSolidTraceTrial(host, face0, u1, v1, true);
          if (crossed !== null && !crossed.crossed) continue;
          if (crossed === null || crossed.face === came) continue;
          // The crossing is judged by where the solve goes on the neighbour, not by its foot: the foot is mapped by the boundary's chord
          // share, a different world point from the iterate's (on f1's arm past its armpit band it stood 0.0035 to 0.0113 mm off the
          // section plane, so every foot's residual exceeded the band end's and the crossing was refused though the arm kept a root).
          // It is taken when one Newton step on the neighbour from the foot, backtracked within the neighbour's region, lowers the
          // residual below this iterate's.
          const settled: IAutoMovieSolidTraceTrialTrial | null = onward(
            crossed,
            merit,
          );
          if (settled !== null) {
            left--;
            came = face0;
            current = settled;
            accepted = true;
            break;
          }
          continue;
        }
        const next: IAutoMovieSolidTraceTrialTrial | null =
          AutoMovieSolidTraceTrial(host, face0, u1, v1, false);
        if (next === null) continue;
        if (lower(next)) {
          current = next;
          accepted = true;
          break;
        }
      }
      if (!accepted)
        return fail(
          "no Newton trial lowered the residual in twenty halvings",
          here,
        );
    }
    return fail("the Newton iterations ran out", { steps });
  }

  /** Unit-world-speed projection of the original kept-side direction. */
  function project(
    j: IAutoMovieSolidSurface.IJet,
    world: Readonly<AutoMovieVector3Tuple>,
  ): [number, number] | null {
    const d: [number, number] | null = AutoMovieSolidVector.solve2(
      dot(j.u, j.u),
      dot(j.u, j.v),
      dot(j.u, j.v),
      dot(j.v, j.v),
      [dot(j.u, world), dot(j.v, world)],
    );
    if (d === null) return null;
    const speed: number = norm(
      combine([
        [d[0], j.u],
        [d[1], j.v],
      ]),
    );
    return speed > 0 ? [d[0] / speed, d[1] / speed] : null;
  }

  /** Settle a positive-width normal section from a regional chart guess. */
  export function section(
    surface: IAutoMovieSolidSurface,
    start: readonly [number, number],
    from: Readonly<AutoMovieVector3Tuple>,
    m: Readonly<AutoMovieVector3Tuple>,
    width: number,
    steps: number,
    rounding: number,
  ): [number, number] | null {
    if (!(norm(m) > 0)) return null;
    const scale: number = width + norm(from);
    let x: [number, number] = [start[0], start[1]];
    for (let step: number = 0; step < steps; step++) {
      const j: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
        surface,
        x[0],
        x[1],
      );
      if (j === null) return null;
      const r: AutoMovieVector3Tuple = sub(j.p, from);
      const f1: number = dot(r, m);
      const f2: number = dot(r, r) - width * width;
      const done: boolean =
        Math.abs(f1) <= rounding * scale &&
        Math.abs(f2) <= 2 * width * rounding * scale;
      const dx: [number, number] | null = AutoMovieSolidVector.solve2(
        dot(j.u, m),
        dot(j.v, m),
        2 * dot(r, j.u),
        2 * dot(r, j.v),
        [-f1, -f2],
      );
      if (dx === null) return null;
      let k: number = 1;
      let trial: number = 0;
      while (
        !AutoMovieSolidDomain.contains(surface, x[0] + k * dx[0]) &&
        trial++ < 20
      )
        k /= 2;
      if (!AutoMovieSolidDomain.contains(surface, x[0] + k * dx[0]))
        return null;
      x = [x[0] + k * dx[0], x[1] + k * dx[1]];
      if (done) return x;
    }
    return null;
  }

  /** Solve positive world chord length along a supplied owned-chart jet reader. */
  export function offset(
    along: (l: number) => IAutoMovieSolidSurface.IJet | null,
    d: readonly [number, number],
    from: Readonly<AutoMovieVector3Tuple>,
    width: number,
    steps: number,
    rounding: number,
    start?: number,
  ): number | null {
    if (!(width > 0)) return null;
    const j0: IAutoMovieSolidSurface.IJet | null = along(0);
    if (j0 === null) return null;
    const speed: number = norm(
      combine([
        [d[0], j0.u],
        [d[1], j0.v],
      ]),
    );
    if (!(speed > 0)) return null;
    let l: number = (start ?? width) / speed;
    for (let step: number = 0; step < steps; step++) {
      const j: IAutoMovieSolidSurface.IJet | null = along(l);
      if (j === null) return null;
      const r: AutoMovieVector3Tuple = sub(j.p, from);
      const chord: number = norm(r);
      const miss: number = chord - width;
      const rate: number =
        dot(
          r,
          combine([
            [d[0], j.u],
            [d[1], j.v],
          ]),
        ) / chord;
      if (!(rate > 0)) return null;
      const converged: boolean =
        Math.abs(miss) <= rounding * (width + norm(from));
      l -= miss / rate;
      if (converged) return along(l) === null ? null : l;
    }
    return null;
  }
}
