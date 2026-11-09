import { AutoMovieIllinois } from "@automovie/engine";

import { AutoMovieHumanTrunkCourses } from "../AutoMovieHumanTrunkCourses";
import type { AutoMovieHumanTorsoSource } from "./AutoMovieHumanTorsoSource";

/** Actual composed-source intersection with the ISO side-neck/bust tape plane, before lofting. */
export namespace AutoMovieHumanTorsoCourse {
  /** Independently defined original endpoints; their availability does not claim a closed or measurable course. */
  export interface IEndpoints {
    /** Actual neck endpoint on the shared generating neck, calibration mm. */
    readonly neck: [number, number, number];

    /** Actual authored breast apex, calibration mm. */
    readonly apex: [number, number, number];

    /** Actual named side-neck material phase in radians. */
    readonly phase: number;

    /** Euclidean endpoint chord lower bound, calibration mm. */
    readonly straightLowerBound: number;
  }

  /** Call-owned failure observation; the actual original exception still propagates unchanged. */
  export interface IWork {
    /** Requested physical station and polar phase when its source call refused; station preparation can fail before evaluating that phase. */
    failure?: Readonly<Record<"station" | "requestedPhase", number>>;
  }

  /** Endpoints are prepared once before the explicitly requested numerical course observation. */
  export interface IPrepared {
    /** Defined datums remain available if a later source-plane crossing refuses. */
    readonly endpoints: IEndpoints;

    /** Strict original twenty-interval observer; no failed reading becomes a result. */
    read(work?: IWork): IReading;
  }

  /** Measured original course and its actual plane samples; not a continuous error certificate. */
  export interface IReading extends IEndpoints {
    /** Taut polygonal course in calibration mm. */
    length: number;

    /** Twenty original intervals retain the existing ISO observer's policy. */
    points: [number, number, number][];

    /** Physical rows with no observed plane crossing; the taut tape bridges those gaps. */
    emptyStations: number[];
  }

  /**
   * Read the actual plane spanned by the endpoints and anatomical anterior.
   *
   * In the body frame that plane prescribes Z linearly in physical Y. The
   * same 512-per-period source observation policy brackets every observed
   * crossing on the positive-Z half. The general engine scalar solver reads
   * the actual whole original and the frontmost root supplies the plane's
   * anterior obstacle. Empty observed rows are recorded, not replaced by a
   * clamped lateral point; the taut tape bridges them. This finite root
   * discovery and the 20-row hull are observations, not certified topology
   * or a continuous tape-error bound. Foreign source failures propagate.
   */
  export function prepare(
    original: Pick<AutoMovieHumanTorsoSource.IOutput, "plan" | "point">,
  ): IPrepared {
    const region: (typeof original.plan.regions)[number] | undefined =
      original.plan.regions.find(
        (item: (typeof original.plan.regions)[number]): boolean =>
          item.name === "breast.left",
      );
    if (region === undefined)
      throw new Error(
        "A side-neck/bust course requires its actual mammary source",
      );
    const site: (typeof original.plan.neckFamily.sites)[number] | undefined =
      original.plan.neckFamily.sites.find((item: (typeof original.plan.neckFamily.sites)[number]): boolean => item.site === "base.left");
    if (site === undefined) throw new Error("The common neck family has no original left side-neck site");
    const y: number = site.point[1];
    const neckXZ: [number, number] = original.point(y, site.phase);
    const neck: [number, number, number] = [neckXZ[0], y, neckXZ[1]];
    const apex: [number, number, number] = [...region.apex];
    const endpoints: IEndpoints = { neck, apex, phase: site.phase,
      straightLowerBound: Math.hypot(...neck.map((value: number, at: number): number => value - apex[at]!)) };
    return { endpoints, read: (work?: IWork): IReading => measure(original, endpoints, work) };
  }

  /** Preserve the strict production reader; callers needing only datums use prepare without requesting its numerical read. */
  export function read(original: Pick<AutoMovieHumanTorsoSource.IOutput, "plan" | "point">, work?: IWork): IReading {
    return prepare(original).read(work);
  }

  /** Observe the same source with already-owned endpoints; all foreign callback exceptions retain their identity. */
  function measure(
    original: Pick<AutoMovieHumanTorsoSource.IOutput, "plan" | "point">,
    endpoints: IEndpoints,
    work?: IWork,
  ): IReading {
    const { neck, apex }: IEndpoints = endpoints;
    if (!(neck[1] > apex[1]))
      throw new Error(
        "The actual side-neck point must be above its bust course endpoint",
      );
    const points: [number, number, number][] = [];
    const emptyStations: number[] = [];
    for (let i: number = 1; i < 20; i++) {
      const share: number = i / 20;
      const station: number = apex[1] + share * (neck[1] - apex[1]);
      const target: number = apex[2] + share * (neck[2] - apex[2]);
      const residual: (phase: number) => number = (phase: number): number => {
        try {
          const value: number = original.point(station, phase)[1] - target;
          if (!Number.isFinite(value))
            throw new Error("The actual ISO tape plane has a nonfinite original residual");
          return value;
        } catch (error: unknown) {
          if (work !== undefined) work.failure = { station, requestedPhase: phase };
          throw error;
        }
      };
      const tolerance: number =
        128 * Number.EPSILON * Math.max(1, Math.abs(target));
      const roots: [number, number][] = [];
      let previous: number = 0;
      let previousResidual: number = residual(previous);
      for (let phaseIndex: number = 1; phaseIndex <= 256; phaseIndex++) {
        const next: number = (Math.PI * phaseIndex) / 256;
        const nextResidual: number = residual(next);
        let phase: number | null = null;
        if (previousResidual === 0) phase = previous;
        else if (nextResidual === 0) phase = next;
        else if (previousResidual < 0 !== nextResidual < 0)
          phase = AutoMovieIllinois.root(
            residual,
            previous,
            next,
            tolerance,
            64,
          );
        if (phase !== null) {
          if (!Number.isFinite(phase) || Math.abs(residual(phase)) > tolerance)
            throw new Error(
              "The actual ISO front course root did not converge at " + station,
            );
          roots.push(original.point(station, phase));
        }
        previous = next;
        previousResidual = nextResidual;
      }
      if (roots.length === 0) emptyStations.push(station);
      else {
        const p: [number, number] = roots.reduce(
          (
            front: [number, number],
            point: [number, number],
          ): [number, number] => (point[0] > front[0] ? point : front),
        );
        points.push([p[0], station, p[1]]);
      }
    }
    if (points.length === 0)
      throw new Error(
        "The actual ISO front tape plane has no observed source intersection",
      );
    const length: number = AutoMovieHumanTrunkCourses.taut(
      neck,
      apex,
      [1, 0, 0],
      points,
    );
    if (!(Number.isFinite(length) && length > 0))
      throw new Error("The actual ISO front course is nonfinite or collapsed");
    return { ...endpoints, length, points, emptyStations };
  }
}
