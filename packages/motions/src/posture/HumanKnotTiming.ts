import { HumanMinimumJerkSpline } from "./HumanMinimumJerkSpline";
import { HumanPathParameterization as TOPP } from "./HumanPathParameterization";
import { HumanQuinticSegment } from "./HumanQuinticSegment";

/**
 * The time-optimal timing of one rest-to-rest piece of a knot path under
 * velocity and acceleration limits.
 *
 * The geometric path is the minimum-jerk path through the knots (Flash and
 * Hogan 1985, J. Neurosci. 5(7):1688; `HumanMinimumJerkSpline`) on a path
 * parameter s: a quintic per knot interval (`HumanQuinticSegment`) whose
 * position, velocity and acceleration carry across each interior knot, at rest
 * at both ends. Each interval's length in s is its chord (Lee 1989, "Choosing
 * nodes in parametric curve interpolation", Computer-Aided Design 21(6):363)
 * divided by the interval's velocity limit, so s is in seconds at the limit and
 * the path velocity ṡ is near one wherever the velocity limit binds.
 *
 * The timing is TOPP-RA (Pham and Pham 2018, IEEE T-RO 34(3):645;
 * `HumanPathParameterization`, ported from github.com/hungpham2511/toppra, MIT,
 * Copyright (c) 2017 Hung Pham) on gridpoints proposed by toppra's
 * `GeometricPath::proposeGridpoints` (cpp/src/toppra/geometric_path.cpp at
 * commit 8a2a9252e42089f1082d8d5d69b9852f32d0b338, ported here with its
 * defaults): the knots, then each interval bisected while it is longer than
 * `MAX_SEG_LENGTH` or its chord's error, `max |0.5 q''(mid) Δs²|`, exceeds the
 * precision, for at most `MAX_ITERATION` passes, then every interval bisected
 * until there are `MIN_NB_POINTS`. The limits are boxes on each coordinate's
 * rate and acceleration (`LinearJointVelocity`, `LinearJointAcceleration`); a
 * gridpoint's acceleration limit A enters as the path's derivatives divided by
 * A against the unit box, the same linear constraint at that gridpoint, so each
 * interval and knot can carry its own. The time map is toppra's `ConstAccel`:
 * constant path acceleration over each grid interval.
 *
 * TOPP-RA meets the limits at the gridpoints only. Between two of them the
 * excess is bounded by the interpolation error of the method's own time map
 * (`excess`), largest near a piece's rest ends, where the path barely moves in
 * s and the path velocity is high; so, in the error-bounded spirit of
 * AutoKnots, every interval whose bound passes the caller's `overshoot` is
 * bisected and the piece solved again, until none does.
 */
export namespace HumanKnotTiming {
  /** A box on every coordinate's rate and acceleration. */
  export interface ILimit {
    /** The greatest rate of each coordinate, units per second, positive. */
    velocity: number;

    /**
     * The greatest acceleration of each coordinate, units per second squared,
     * positive.
     */
    acceleration: number;
  }

  /** One piece to time. */
  export interface IProblem {
    /** The piece's knots, two or more, consecutive knots distinct. */
    positions: readonly (readonly number[])[];

    /** Each knot interval's limits, one fewer than the knots. */
    segments: readonly ILimit[];

    /**
     * Each knot's own limits, tightening its intervals' at the knot; null where
     * the knot has none, all null when absent.
     */
    knots?: readonly (ILimit | null)[];

    /**
     * The greatest error between the path and its chord over a grid interval,
     * in the coordinates' units (toppra's `maxErrThreshold`).
     */
    precision: number;

    /**
     * The greatest share of a limit a coordinate's rate or acceleration may
     * pass it by between gridpoints, positive: the grid is refined until the
     * method's own bound on that excess (`excess`) is within it on every
     * interval.
     */
    overshoot: number;
  }

  /** A timed piece, its time from zero at its start. */
  export interface ITimed {
    /** Each knot's path parameter, from zero. */
    stations: number[];

    /**
     * The geometric path over each knot interval, its duration the interval's
     * s.
     */
    segments: HumanQuinticSegment.ISegment[];

    /** The TOPP-RA gridpoints in s, the stations among them. */
    gridpoints: number[];

    /** The instant each gridpoint is reached, seconds (`ConstAccel::m_ts`). */
    times: number[];

    /** The path velocity ṡ at each gridpoint (`m_vs`). */
    velocities: number[];

    /** The path acceleration over each grid interval (`m_us`). */
    accelerations: number[];

    /** The piece's duration, seconds. */
    duration: number;
  }

  /** Toppra's default `maxIteration` of `proposeGridpoints`. */
  export const MAX_ITERATION: number = 100;

  /** Toppra's default `maxSegLength` of `proposeGridpoints`, in s. */
  export const MAX_SEG_LENGTH: number = 0.05;

  /** Toppra's default `minNbPoints` of `proposeGridpoints`. */
  export const MIN_NB_POINTS: number = 100;

  /**
   * Time one rest-to-rest piece.
   *
   * @param problem The knots, their limits and the grid's precision.
   * @returns The piece's path and time map.
   * @throws {Error} When two consecutive knots coincide (a hold is a dwell, not
   *   a repeated knot), TOPP-RA finds the limits infeasible, or the grid's
   *   refinement cannot meet the overshoot in `MAX_REFINEMENT` passes.
   */
  export function parametrize(problem: IProblem): ITimed {
    const { positions, segments }: IProblem = problem;
    const stations: number[] = [0];
    for (let j: number = 0; j + 1 < positions.length; ++j) {
      const chord: number = Math.hypot(
        ...positions[j + 1]!.map(
          (v: number, c: number): number => v - positions[j]![c]!,
        ),
      );
      if (!(chord > 0))
        throw new Error("Consecutive knots of a piece must differ");
      stations.push(stations[j]! + chord / segments[j]!.velocity);
    }
    const derived: HumanMinimumJerkSpline.IDerivatives =
      HumanMinimumJerkSpline.derivatives(stations, positions);
    const path: HumanQuinticSegment.ISegment[] = [];
    for (let j: number = 0; j + 1 < positions.length; ++j)
      path.push(
        HumanQuinticSegment.prepare(
          {
            position: positions[j]!,
            velocity: derived.velocities[j]!,
            acceleration: derived.accelerations[j]!,
          },
          {
            position: positions[j + 1]!,
            velocity: derived.velocities[j + 1]!,
            acceleration: derived.accelerations[j + 1]!,
          },
          stations[j + 1]! - stations[j]!,
        ),
      );
    const curve: (s: number) => HumanQuinticSegment.IState = (
      s: number,
    ): HumanQuinticSegment.IState => {
      const j: number = below(stations, s, path.length - 1);
      return HumanQuinticSegment.state(path[j]!, s - stations[j]!);
    };
    const gridpoints: number[] = propose(stations, curve, problem.precision);

    // TOPP-RA holds the limits at the gridpoints; bisect every interval whose
    // excess between them, by the bound of `excess`, passes the requirement,
    // and solve again, until none does.
    for (let pass: number = 0; ; ++pass) {
      const timed: TOPP.ITimed = solve(problem, stations, curve, gridpoints);
      const split: number[] = [];
      for (let i: number = 0; i + 1 < gridpoints.length; ++i) {
        const j: number = below(stations, gridpoints[i]!, path.length - 1);
        const limit: ILimit = segments[j]!;
        const bound: IExcess = excess(
          path[j]!,
          gridpoints[i]! - stations[j]!,
          gridpoints[i + 1]! - stations[j]!,
          timed.velocities[i]! ** 2,
          timed.velocities[i + 1]! ** 2,
          timed.accelerations[i]!,
        );
        if (
          bound.acceleration > problem.overshoot * limit.acceleration ||
          bound.speed > ((1 + problem.overshoot) ** 2 - 1) * limit.velocity ** 2
        )
          split.push(i);
      }
      if (split.length === 0)
        return {
          stations,
          segments: path,
          gridpoints,
          times: timed.times,
          velocities: timed.velocities,
          accelerations: timed.accelerations,
          duration: timed.times[timed.times.length - 1]!,
        };
      if (pass === MAX_REFINEMENT)
        throw new Error(
          "TOPP-RA's grid cannot bring its between-gridpoint excess within the overshoot",
        );
      for (const i of split.reverse())
        gridpoints.splice(
          i + 1,
          0,
          0.5 * (gridpoints[i]! + gridpoints[i + 1]!),
        );
    }
  }

  /**
   * The bisection passes of the grid's error-bounded refinement: each halves
   * every interval still over the requirement, so forty reach 2⁻⁴⁰ of the
   * coarsest, past any requirement the bound's Δ² scaling can be asked for.
   */
  export const MAX_REFINEMENT: number = 40;

  /**
   * The position at a second of a timed piece: the path parameter from the
   * constant-acceleration time map (`ConstAccel::evalParams`), then the path.
   *
   * @param timed The timed piece.
   * @param seconds The instant from the piece's start, held within its span.
   * @returns Each coordinate's position.
   */
  export function position(timed: ITimed, seconds: number): number[] {
    const s: number = along(timed, seconds)[0];
    const j: number = below(timed.stations, s, timed.segments.length - 1);
    return HumanQuinticSegment.position(
      timed.segments[j]!,
      s - timed.stations[j]!,
    );
  }

  /**
   * The state at a second of a timed piece, by the chain rule on q(s(t)): q̇ =
   * q' ṡ, q̈ = q' s̈ + q'' ṡ², and q⃛ = q''' ṡ³ + 3 q'' ṡ s̈, the path
   * acceleration constant over each grid interval.
   *
   * @param timed The timed piece.
   * @param seconds The instant from the piece's start, held within its span.
   * @returns The state there, in the coordinates' units per second.
   */
  export function state(
    timed: ITimed,
    seconds: number,
  ): HumanQuinticSegment.IState {
    const [s, sd, sdd]: [number, number, number] = along(timed, seconds);
    const j: number = below(timed.stations, s, timed.segments.length - 1);
    const at: HumanQuinticSegment.IState = HumanQuinticSegment.state(
      timed.segments[j]!,
      s - timed.stations[j]!,
    );
    return {
      position: at.position,
      velocity: at.velocity.map((v: number): number => v * sd),
      acceleration: at.velocity.map(
        (v: number, c: number): number =>
          v * sdd + at.acceleration[c]! * sd * sd,
      ),
      jerk: at.jerk.map(
        (v: number, c: number): number =>
          v * sd * sd * sd + 3 * at.acceleration[c]! * sd * sdd,
      ),
    };
  }

  /**
   * The method's own bound on how far a grid interval's acceleration and
   * squared speed pass the larger of their values at its two gridpoints.
   *
   * Over an interval of length Δ the path acceleration u is constant
   * (`ConstAccel`), so x = ṡ² runs linearly in s and the coordinate's
   * acceleration is f = q' u + q'' x and its squared speed h = q'² x, smooth
   * functions of s whose departure from the chord of their end values is at
   * most Δ² / 8 times their greatest second derivative: f'' = 5 q''' u + q''''
   * x and h'' = 2 (q''² + q' q''') x + 8 q' q'' u. Each derivative's greatest
   * magnitude over the interval is bounded the same way from its own ends, the
   * quintic's fifth derivative constant, so the bound is closed-form and never
   * below the true excess.
   *
   * @param segment The path's quintic over the interval, its duration in s.
   * @param a The interval's start in the quintic's own s.
   * @param b Its end.
   * @param xa The squared path velocity at its start.
   * @param xb At its end.
   * @param u The constant path acceleration over it.
   * @returns The acceleration's and the squared speed's greatest excess over
   *   the coordinates.
   */
  export function excess(
    segment: HumanQuinticSegment.ISegment,
    a: number,
    b: number,
    xa: number,
    xb: number,
    u: number,
  ): IExcess {
    const delta: number = b - a;
    const chord: number = (delta * delta) / 8;
    const T: number = segment.duration;
    const start: HumanQuinticSegment.IState = HumanQuinticSegment.state(
      segment,
      a,
    );
    const end: HumanQuinticSegment.IState = HumanQuinticSegment.state(
      segment,
      b,
    );
    const x: number = Math.max(xa, xb);
    let acceleration: number = 0;
    let speed: number = 0;
    segment.coefficients.forEach((c: readonly number[], k: number): void => {
      const snap = (s: number): number =>
        Math.abs((24 * c[4]! + 120 * c[5]! * (s / T)) / T ** 4);
      const fifth: number = Math.abs((120 * c[5]!) / T ** 5);
      const m4: number = Math.max(snap(a), snap(b));
      const m3: number =
        Math.max(Math.abs(start.jerk[k]!), Math.abs(end.jerk[k]!)) +
        chord * fifth;
      const m2: number =
        Math.max(
          Math.abs(start.acceleration[k]!),
          Math.abs(end.acceleration[k]!),
        ) +
        chord * m4;
      const m1: number =
        Math.max(Math.abs(start.velocity[k]!), Math.abs(end.velocity[k]!)) +
        chord * m3;
      acceleration = Math.max(
        acceleration,
        chord * (5 * m3 * Math.abs(u) + m4 * x),
      );
      speed = Math.max(
        speed,
        chord * (2 * (m2 * m2 + m1 * m3) * x + 8 * m1 * m2 * Math.abs(u)),
      );
    });
    return { acceleration, speed };
  }

  /** A grid interval's bound on its excess between gridpoints (`excess`). */
  export interface IExcess {
    /** The acceleration's, the coordinate's units per second squared. */
    acceleration: number;

    /** The squared speed's, the coordinate's units squared per second squared. */
    speed: number;
  }
}

/**
 * The constraints at every gridpoint and the TOPP-RA solve over them: each
 * gridpoint's limits its interval's, and at a knot the tighter of its two
 * intervals' and its own.
 */
function solve(
  problem: HumanKnotTiming.IProblem,
  stations: readonly number[],
  curve: (s: number) => HumanQuinticSegment.IState,
  gridpoints: readonly number[],
): TOPP.ITimed {
  const { positions, segments }: HumanKnotTiming.IProblem = problem;
  const first: number[][] = [];
  const second: number[][] = [];
  const scaledFirst: number[][] = [];
  const scaledSecond: number[][] = [];
  const lower: number[][] = [];
  const upper: number[][] = [];
  let station: number = 0;
  for (const s of gridpoints) {
    let limit: HumanKnotTiming.ILimit;
    if (station < stations.length && s === stations[station]) {
      limit = tighter(
        segments[Math.max(0, station - 1)]!,
        segments[Math.min(segments.length - 1, station)]!,
      );
      const own: HumanKnotTiming.ILimit | null | undefined =
        problem.knots?.[station];
      if (own !== undefined && own !== null) limit = tighter(limit, own);
      ++station;
    } else limit = segments[station - 1]!;
    const at: HumanQuinticSegment.IState = curve(s);
    first.push(at.velocity);
    second.push(at.acceleration);
    scaledFirst.push(
      at.velocity.map((v: number): number => v / limit.acceleration),
    );
    scaledSecond.push(
      at.acceleration.map((v: number): number => v / limit.acceleration),
    );
    lower.push(at.velocity.map((): number => -limit.velocity));
    upper.push(at.velocity.map((): number => limit.velocity));
  }
  const unit: number[] = positions[0]!.map((): number => 1);
  const solved: TOPP.IResult = TOPP.parametrize({
    path: { gridpoints, first: scaledFirst, second: scaledSecond },
    velocities: [{ first, lower, upper }],
    accelerations: [
      { lower: unit.map((v: number): number => -v), upper: unit },
    ],
    start: 0,
    end: 0,
  });
  if (solved.status !== "ok")
    throw new Error(`TOPP-RA failed in its ${solved.status} pass`);
  return TOPP.timed(gridpoints, solved.parametrization);
}

/** The tighter of two limits, coordinate by coordinate. */
function tighter(
  a: HumanKnotTiming.ILimit,
  b: HumanKnotTiming.ILimit,
): HumanKnotTiming.ILimit {
  return {
    velocity: Math.min(a.velocity, b.velocity),
    acceleration: Math.min(a.acceleration, b.acceleration),
  };
}

/**
 * The last index i at most `last` whose value is at or below x, by binary
 * search over ascending values.
 */
function below(values: readonly number[], x: number, last: number): number {
  let low: number = 0;
  let high: number = last;
  while (low < high) {
    const middle: number = (low + high + 1) >> 1;
    if (values[middle]! <= x) low = middle;
    else high = middle - 1;
  }
  return low;
}

/**
 * The path parameter, its rate and its acceleration at a second
 * (`ConstAccel::evalParams`): s_i + ṡ_i τ + u_i τ² / 2 on the grid interval
 * reached.
 */
function along(
  timed: HumanKnotTiming.ITimed,
  seconds: number,
): [number, number, number] {
  const t: number = Math.min(timed.duration, Math.max(0, seconds));
  const i: number = below(timed.times, t, timed.accelerations.length - 1);
  const dt: number = t - timed.times[i]!;
  const u: number = timed.accelerations[i]!;
  const s: number = Math.min(
    timed.gridpoints[i + 1]!,
    timed.gridpoints[i]! + timed.velocities[i]! * dt + 0.5 * u * dt * dt,
  );
  return [s, Math.max(0, timed.velocities[i]! + u * dt), u];
}

/**
 * Toppra's `GeometricPath::proposeGridpoints` from the given initial
 * gridpoints: bisect an interval longer than `MAX_SEG_LENGTH`, else one whose
 * chord error `max |0.5 q''(mid) Δs²|` exceeds the threshold, each bisection's
 * right half examined next in the same pass, for at most `MAX_ITERATION`
 * passes; then bisect every interval, pass by pass, until there are
 * `MIN_NB_POINTS`.
 */
function propose(
  initial: readonly number[],
  curve: (s: number) => HumanQuinticSegment.IState,
  threshold: number,
): number[] {
  const grid: number[] = [...initial];
  for (let pass: number = 0; pass < HumanKnotTiming.MAX_ITERATION; ++pass) {
    let added: boolean = false;
    for (let i: number = 0; i + 1 < grid.length; ++i) {
      const mid: number = 0.5 * (grid[i]! + grid[i + 1]!);
      const dist: number = grid[i + 1]! - grid[i]!;
      if (dist > HumanKnotTiming.MAX_SEG_LENGTH) {
        grid.splice(i + 1, 0, mid);
        added = true;
        continue;
      }
      let error: number = 0;
      for (const v of curve(mid).acceleration)
        error = Math.max(error, Math.abs(0.5 * v * dist * dist));
      if (error > threshold) {
        grid.splice(i + 1, 0, mid);
        added = true;
      }
    }
    if (!added) break;
  }
  while (grid.length < HumanKnotTiming.MIN_NB_POINTS) {
    const next: number[] = [grid[0]!];
    for (let i: number = 0; i + 1 < grid.length; ++i)
      next.push(0.5 * (grid[i]! + grid[i + 1]!), grid[i + 1]!);
    grid.splice(0, grid.length, ...next);
  }
  return grid;
}
