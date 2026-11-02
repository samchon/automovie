import { AutoMovieHumanHeadCranialImplicitSection as I } from "./AutoMovieHumanHeadCranialImplicitSection";
import { AutoMovieHumanHeadCranialMeasurements as M } from "./AutoMovieHumanHeadCranialMeasurements";
import { AutoMovieHumanHeadCranialSupportDeformation as D } from "./AutoMovieHumanHeadCranialSupportDeformation";

/** Lightweight actual-source cranial support control and final-skin tape reader. */
export namespace AutoMovieHumanHeadCranialSupport {
  /** Exact current source section and its constants; no expected dimension enters. */
  export type ISection = I.Inputs;
  /** Actual final-skin physical section, with both sides fully represented. */
  export interface ICourse {
    /** Existing source station. */
    station: number;
    /** Existing source section-plane tilt. */
    tilt: number;
    /** Actual final skin points on this plane, excluding attached auricles. */
    points: readonly [number, number, number][];
  }
  /** Maximum actual taut tape and its physical frame. */
  export interface IReading {
    /** Maximum actual convex-hull tape across the supplied physical courses. */
    circumference: number;
    /** Actual maximizing source station. */
    station: number;
    /** Actual curve's forward/backward midpoint in the head frame. */
    origin: [number, number, number];
    /** Existing physical course's plane normal. */
    normal: [number, number, number];
  }
  /** A query stays renderable but explicitly retains any failed geometry. */
  export interface IRadius {
    /** Changed radius on the exact original consumer ray, or the unchanged source on failure. */
    radius: number;
    /** Geometry acceptance, distinct from clinical availability. */
    healthy: boolean;
    /** False for the exact zero-deformation bypass; that path certifies no source health. */
    sourceChecked: boolean;
    /** Actual source implicit residual. */
    sourceResidual: number;
    /** Explicit unaccepted geometry cause. */
    reason?: string;
    /** Numerical changed-curve ray residual. */
    angularResidual: number;
    /** Changed-curve source query count. */
    iterations: number;
  }

  /** C2 zero jets at existing full-skull handover and actual crown-ring/cap join. */
  export function weight(station: number, lower: number, upper: number): number {
    const u: number = (station - lower) / (upper - lower);
    return u <= 0 || u >= 1 ? 0 : (4 * u * (1 - u)) ** 3;
  }

  /**
   * Compile only the current actual implicit differential law. Each radius
   * query calls the existing source radius callback, and bounded Newton solves
   * the changed curve's actual intersection with the original consumer ray.
   * There is no 8k survey, hull measurement or source identity replacement in
   * this query path. A rejected geometry is returned unchanged and stays red.
   */
  export function prepare(section: ISection, originXi: number, sourceRadius: (theta: number) => number): (theta: number, coefficientMm: number) => IRadius {
    const operator: I.Operator = I.operator(section);
    return (theta: number, coefficientMm: number): IRadius => {
      if (coefficientMm === 0) return { radius: sourceRadius(theta), healthy: true, sourceChecked: false, sourceResidual: NaN, angularResidual: 0, iterations: 1 };
      const source = (angle: number): I.PolarJet => {
        const radius: number = sourceRadius(angle);
        const p: [number, number] = [originXi + radius * Math.cos(angle), radius * Math.sin(angle)];
        return I.differential(p, operator.evaluate(p[0], p[1]), originXi, angle);
      };
      const result: D.RayResult = D.radial(source, originXi, theta, coefficientMm, operator.spatialC2);
      return result.ok
        ? { radius: result.radius, healthy: true, sourceChecked: true, sourceResidual: result.sourceResidual, angularResidual: result.angularResidual, iterations: result.iterations }
        : { radius: sourceRadius(theta), healthy: false, sourceChecked: true, sourceResidual: result.sourceResidual, reason: result.reason, angularResidual: NaN, iterations: 0 };
    };
  }

  /**
   * Observe actual final-skin tape independently of coefficient and targets.
   * Projection uses each existing source plane; its convex hull is a tape
   * observation and never replaces the source skin or supplies a C2 claim.
   */
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

  /** Newton tape increment uses the physical support identity; no positive-only coefficient is assumed. */
  export function increment(coefficientMm: number, achieved: number, requested: number, activeWeight: number): number {
    return Number.isFinite(achieved) && Number.isFinite(requested) && activeWeight > 0
      ? coefficientMm + (requested - achieved) / (Math.PI * activeWeight)
      : coefficientMm;
  }
}
