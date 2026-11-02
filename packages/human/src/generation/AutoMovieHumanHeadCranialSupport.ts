import { AutoMovieHumanHeadCranialImplicitSection as I } from "./AutoMovieHumanHeadCranialImplicitSection";
import { AutoMovieHumanHeadCranialMeasurements as M } from "./AutoMovieHumanHeadCranialMeasurements";
import { AutoMovieHumanHeadCranialSupportDeformation as D } from "./AutoMovieHumanHeadCranialSupportDeformation";
import { AutoMovieHumanHeadCranialSourceRoot as R } from "./AutoMovieHumanHeadCranialSourceRoot";
import { AutoMovieHumanHeadCranialExactCache as Cache } from "./AutoMovieHumanHeadCranialExactCache";

/** Unchanged physical support control with exact bounded reuse and real work. */
export namespace AutoMovieHumanHeadCranialSupport {
  /** Actual source primitive record, without expected landmark values. */
  export type ISection = I.Inputs;
  /** Actual final-skin physical section, including both source sides. */
  export interface ICourse {
    /** Existing physical source station. */
    station: number;
    /** Existing physical section tilt. */
    tilt: number;
    /** Actual skin samples; no hull replaces their source geometry. */
    points: readonly [number, number, number][];
  }
  /** Independent actual taut-tape observation and physical course frame. */
  export interface IReading {
    /** Actual maximum convex-hull tape in millimetres. */
    circumference: number;
    /** Actual maximizing physical station. */
    station: number;
    /** Actual forward/backward support midpoint. */
    origin: [number, number, number];
    /** Actual course plane normal. */
    normal: [number, number, number];
  }
  /** Every query reports executed work separately from the cached solve. */
  export interface IRadius {
    /** Actual changed-ray radius, or unchanged source radius on explicit failure. */
    radius: number;
    /** Deformation acceptance, separate from clinical availability. */
    healthy: boolean;
    /** Neutral queries certify no source differential. */
    sourceChecked: boolean;
    /** Actual source residual when a root or differential supplied one. */
    sourceResidual: number;
    /** Explicit unaccepted geometry condition. */
    reason?: string;
    /** Actual final angular residual, retaining an exhausted solve's observation. */
    angularResidual: number;
    /** Outer iterations actually executed by this invocation. */
    iterations: number;
    /** Original solve's iterations, retained on exact result-cache hits. */
    solveIterations: number;
    /** Source sample requests actually made by this invocation. */
    sourceQueries: number;
    /** Calls actually made to the source radius callback. */
    sourceRadiusCalls: number;
    /** Exact source sample requests served without another source radius call. */
    sourceCacheHits: number;
    /** True only when this invocation reused an exactly identical complete result. */
    resultCacheHit: boolean;
  }
  /** Resource budgets change cache storage only, never geometry or precision. */
  export interface ICacheOptions {
    /** Retained exact source angles per frozen physical section; default 512. */
    sourceEntries?: number;
    /** Retained exact result angles for the current coefficient; default 256. */
    resultEntries?: number;
  }
  /** Current exact cache sizes for bounded resource verification. */
  export interface IStatistics {
    /** Retained exact source angles. */
    sourceEntries: number;
    /** Retained exact result angles at the current coefficient. */
    resultEntries: number;
  }
  /** Frozen-source query callable and its actual retained storage. */
  export interface IPrepared {
    /** Read the exact source ray under one physical support coefficient. */
    (theta: number, coefficientMm: number): IRadius;
    /** Inspect resource counts without evaluating a source or changing geometry. */
    statistics: () => IStatistics;
  }
  /** One exact source radius and its optional analytic differential. */
  interface ISource {
    /** Actual physical source radius. */
    radius: number;
    /** Explicit stricter root failure, retaining its previous bounded skin. */
    root?: R.IResult;
    /** Actual source differential, computed only when deformation needs it. */
    differential?: I.PolarJet;
  }

  /** Original C2-zero station basis, unchanged from the source snapshot. */
  export function weight(station: number, lower: number, upper: number): number {
    const u: number = (station - lower) / (upper - lower);
    return u <= 0 || u >= 1 ? 0 : (4 * u * (1 - u)) ** 3;
  }

  /** Read the actual original field root with a compatible coordinate budget. */
  export function sourceRadius(section: ISection, originXi: number, theta: number, guess: number = 0): R.IResult {
    return R.prepare(section, originXi)(theta, guess);
  }

  /**
   * Freeze one actual section and origin until the owning head rebuilds.
   * Exact angle keys reuse source samples; exact angle/coefficient keys reuse
   * complete accepted or failed solves. No interpolation or rounding enters.
   * Source cache storage is bounded; only one coefficient's results survive.
   */
  export function prepare(section: ISection, originXi: number, sourceRadiusCallback: (theta: number) => number | R.IResult, options: ICacheOptions = {}): IPrepared {
    const operator: I.Operator = I.operator(section);
    const sources: Cache.Lru<number, ISource> = new Cache.Lru(options.sourceEntries ?? 512);
    const results: Cache.Lru<number, IRadius> = new Cache.Lru(options.resultEntries ?? 256);
    let coefficient: number = NaN;
    const query: IPrepared = ((theta: number, coefficientMm: number): IRadius => {
      if (coefficientMm !== coefficient) { coefficient = coefficientMm; results.clear(); }
      const cached: IRadius | undefined = results.get(theta);
      if (cached !== undefined) return { ...cached, iterations: 0, sourceQueries: 0, sourceRadiusCalls: 0, sourceCacheHits: 0, resultCacheHit: true };
      let calls: number = 0;
      let requests: number = 0;
      let hits: number = 0;
      let sourceFailure: string | undefined;

      /** Count exact source requests and reuse only the same frozen-source angle. */
      const read: (angle: number) => ISource = (angle: number): ISource => {
        requests++;
        const known: ISource | undefined = sources.get(angle);
        if (known !== undefined) { hits++; return known; }
        calls++;
        const supplied: number | R.IResult = sourceRadiusCallback(angle);
        const value: ISource = typeof supplied === "number" ? { radius: supplied } : { radius: supplied.radius, root: supplied };
        sources.set(angle, value);
        return value;
      };
      if (coefficientMm === 0) {
        const value: ISource = read(theta);
        const result: IRadius = { radius: value.radius, healthy: value.root?.healthy ?? true, sourceChecked: false, sourceResidual: value.root?.fieldResidual ?? NaN, reason: value.root?.reason, angularResidual: 0, iterations: 0, solveIterations: 0, sourceQueries: requests, sourceRadiusCalls: calls, sourceCacheHits: hits, resultCacheHit: false };
        results.set(theta, result);
        return result;
      }

      /** Observe the actual source differential while retaining explicit root failures. */
      const source: (angle: number) => I.PolarJet = (angle: number): I.PolarJet => {
        const value: ISource = read(angle);
        if (value.differential === undefined) {
          const p: [number, number] = [originXi + value.radius * Math.cos(angle), value.radius * Math.sin(angle)];
          value.differential = value.root !== undefined && !value.root.healthy
            ? { point: p, normal: [NaN, NaN], curvature: NaN, speed: NaN, residual: value.root.fieldResidual }
            : I.differential(p, operator.evaluate(p[0], p[1]), originXi, angle);
        }
        if (value.root !== undefined && !value.root.healthy) sourceFailure = value.root.reason;
        return value.differential;
      };
      const solved: D.RayResult = D.radial(source, originXi, theta, coefficientMm, operator.spatialC2);
      const radius: number = solved.ok ? solved.radius : read(theta).radius;
      const result: IRadius = { radius, healthy: solved.ok, sourceChecked: true, sourceResidual: solved.sourceResidual, reason: solved.ok ? undefined : sourceFailure ?? solved.reason, angularResidual: solved.angularResidual, iterations: solved.iterations, solveIterations: solved.iterations, sourceQueries: requests, sourceRadiusCalls: calls, sourceCacheHits: hits, resultCacheHit: false };
      results.set(theta, result);
      return result;
    }) as IPrepared;
    query.statistics = (): IStatistics => ({ sourceEntries: sources.size, resultEntries: results.size });
    return query;
  }

  /**
   * Bound the existing exact-station owner cache at 64 physical sections.
   * Rebuilding already clears the source owner; eviction only recomputes an
   * identical section later and never rounds a station or changes sampling.
   */
  export function stationQuery(cache: Map<number, IPrepared> | undefined, station: number, create: () => IPrepared): IPrepared {
    let query: IPrepared | undefined = cache?.get(station);
    if (query === undefined) query = create();
    if (cache !== undefined) {
      cache.delete(station);
      if (cache.size >= 64) cache.delete(cache.keys().next().value!);
      cache.set(station, query);
    }
    return query;
  }

  /** Original final-skin tape reader; physical projection and hull law are unchanged. */
  export function measure(courses: readonly ICourse[]): IReading {
    let out: IReading = { circumference: NaN, station: NaN, origin: [NaN, NaN, NaN], normal: [NaN, NaN, NaN] };
    for (const course of courses) {
      const cos: number = Math.cos(course.tilt);
      const sin: number = Math.sin(course.tilt);
      const points: M.Point[] = course.points.map((p: readonly number[]): M.Point => [p[0]! * cos + (p[1]! - course.station) * sin, p[2]!]);
      const reading: M.Measures = M.read(points);
      if (!Number.isFinite(out.circumference) || reading.circumference > out.circumference) {
        const centre: number = (Math.min(...points.map((p: M.Point): number => p[0])) + Math.max(...points.map((p: M.Point): number => p[0]))) / 2;
        out = { circumference: reading.circumference, station: course.station, origin: [centre * cos, course.station + centre * sin, 0], normal: [-sin, cos, 0] };
      }
    }
    return out;
  }

  /** Original signed physical Newton update; no tolerance or dimension is changed. */
  export function increment(coefficientMm: number, achieved: number, requested: number, activeWeight: number): number {
    return Number.isFinite(achieved) && Number.isFinite(requested) && activeWeight > 0 ? coefficientMm + (requested - achieved) / (Math.PI * activeWeight) : coefficientMm;
  }
}
