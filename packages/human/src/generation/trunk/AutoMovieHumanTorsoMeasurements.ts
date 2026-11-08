import { convexHull2D } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanTrunkCourses } from "../AutoMovieHumanTrunkCourses";
import { AutoMovieHumanTorsoCourse } from "./AutoMovieHumanTorsoCourse";
import type { AutoMovieHumanTorsoPlan } from "./AutoMovieHumanTorsoPlan";
import type { AutoMovieHumanTorsoSource } from "./AutoMovieHumanTorsoSource";

/** Public targets and source-only observations in actual common planes, independently of constraint closure or lofting. */
export namespace AutoMovieHumanTorsoMeasurements {
  /** A requested measurement and its honest source observation, calibration mm. */
  export interface IReading {
    /** Same semantic identity as the plan's public constraint. */
    name: string;
    /** Supplied target, never changed by this observer. */
    target: number;
    /** No child/port originals are supplied, so this is not a complete body's tape. */
    scope: "S00-only";
    /** Actual numeric observation, or null without the required source query. */
    actual: number | null;
    /** Actual minus target, or null when no reading was made. */
    residual: number | null;
    /** Reading does not imply a solved constraint or a continuous-tape certificate. */
    method:
      | "sampled-original-caliper"
      | "sampled-original-hull"
      | "sampled-original-taut-course"
      | "unavailable";
    /** Actual common-plane station, or null for an unavailable surface course. */
    station: number | null;
    /** Original query count including authored material clocks, or zero without a query. */
    points: number;
    /** Source, approximation and unavailability meaning. */
    detail: string;
  }

  /** Observe two original tape planes without inverse cuts, completed masses or construction sampling. */
  export function read(
    original: Pick<
      AutoMovieHumanTorsoSource.IOutput,
      "plan" | "point" | "guides"
    >,
  ): readonly IReading[] {
    const plan: AutoMovieHumanTorsoPlan.IOutput = original.plan;
    const phases: readonly number[] = [
      ...new Set([
        ...Array.from(
          { length: 512 },
          (_: unknown, index: number): number => (2 * Math.PI * index) / 512,
        ),
        ...original.guides.map(
          (guide: AutoMovieHumanTorsoSource.IGuide): number => guide.clock,
        ),
      ]),
    ];
    const planes: Map<
      "chest" | "hip",
      { station: number; points: IAutoMovieVector3[]; girth: number }
    > = new Map();
    for (const name of ["chest", "hip"] as const) {
      const site: (typeof plan.wall.sites)[number] | undefined =
        plan.wall.sites.find(
          (candidate: (typeof plan.wall.sites)[number]): boolean =>
            candidate.site === (name === "chest" ? "chest" : "buttock"),
        );
      if (site === undefined)
        throw new Error(
          "Actual torso measurement plane is unavailable: " + name,
        );
      const points: IAutoMovieVector3[] = phases.map(
        (phase: number): IAutoMovieVector3 => {
          const p: [number, number] = original.point(site.y, phase);
          if (!p.every(Number.isFinite))
            throw new Error(
              "Actual torso measurement has a nonfinite original point",
            );
          return { x: p[0], y: site.y, z: p[1] };
        },
      );
      const hull: IAutoMovieVector3[] = convexHull2D(points);
      if (hull.length < 3)
        throw new Error(
          "Actual torso tape plane has no nondegenerate original hull",
        );
      const girth: number = hull.reduce(
        (sum: number, p: IAutoMovieVector3, index: number): number => {
          const next: IAutoMovieVector3 = hull[(index + 1) % hull.length]!;
          return sum + Math.hypot(next.x - p.x, next.z - p.z);
        },
        0,
      );
      if (!(Number.isFinite(girth) && girth > 0))
        throw new Error(
          "Actual original tape length is not finite and positive",
        );
      planes.set(name, { station: site.y, points, girth });
    }
    return plan.constraints.map(
      (constraint: AutoMovieHumanTorsoPlan.IConstraint): IReading => {
        if (constraint.name === "backNeckToWaist")
          return backCourse(original, constraint);
        if (
          constraint.name === "sideNeckToBustPoint" &&
          plan.regions.some(
            (region: AutoMovieHumanTorsoPlan.IRegion): boolean =>
              region.outward === 1,
          )
        ) {
          const reading: AutoMovieHumanTorsoCourse.IReading =
            AutoMovieHumanTorsoCourse.read(original);
          return {
            name: constraint.name,
            target: constraint.target,
            scope: "S00-only",
            actual: reading.length,
            residual: reading.length - constraint.target,
            method: "sampled-original-taut-course",
            station: reading.apex[1],
            points: reading.points.length + 2,
            detail:
              "Actual whole-original intersection with the endpoints/+X plane: 20 physical intervals, 512-per-period crossing discovery, exact scalar-root residual admission and the existing taut hull. No continuous root-discovery/tape-error certificate; observed empty rows are bridged: " +
              JSON.stringify(reading.emptyStations),
          };
        }
        if (constraint.reading === "surface-course")
          return {
            name: constraint.name,
            target: constraint.target,
            scope: "S00-only",
            actual: null,
            residual: null,
            method: "unavailable",
            station: null,
            points: 0,
            detail:
              "The original ISO taut-course plane needs a composed-source coordinate query; an arbitrary material-meridian length is not that measurement.",
          };
        const plane: NonNullable<ReturnType<typeof planes.get>> = planes.get(
          constraint.name.startsWith("chest") ? "chest" : "hip",
        )!;
        const values: number[] = plane.points.map(
          (p: IAutoMovieVector3): number =>
            constraint.reading === "breadth" ? p.z : p.x,
        );
        const actual: number =
          constraint.reading === "taut-hull"
            ? plane.girth
            : Math.max(...values) - Math.min(...values);
        if (!Number.isFinite(actual))
          throw new Error("Actual original caliper is not finite");
        return {
          name: constraint.name,
          target: constraint.target,
          scope: "S00-only",
          actual,
          residual: actual - constraint.target,
          method:
            constraint.reading === "taut-hull"
              ? "sampled-original-hull"
              : "sampled-original-caliper",
          station: plane.station,
          points: plane.points.length,
          detail:
            "512 unchanged angular queries plus exact authored material clocks on S00. Polygon calipers/hull are observations, not continuous-extremum or tape-error bounds. Unprovided leg/port contributors at the hip are not included; no full-body tape closure follows.",
        };
      },
    );
  }
}

/** The existing ISO back-median taut course reads the actual new original; its old 2 mm observation spacing is unchanged. */
function backCourse(
  original: Pick<AutoMovieHumanTorsoSource.IOutput, "plan" | "point">,
  constraint: AutoMovieHumanTorsoPlan.IConstraint,
): AutoMovieHumanTorsoMeasurements.IReading {
  const waist: number =
    original.plan.measures.waistHeight * original.plan.scale;
  const cervicale: number | undefined =
    original.plan.neckFamily.controls.height.knots.find(
      (knot: { site: string }): boolean => knot.site === "base.cervicale",
    )?.value;
  if (
    cervicale === undefined ||
    !(
      waist >= original.plan.domain[0] &&
      cervicale > waist &&
      cervicale <= original.plan.domain[1] &&
      waist + 2 > waist
    )
  )
    throw new Error(
      "Actual back-neck/waist course leaves its retained original domain",
    );

  /** Actual posterior median, not a replacement path through another material meridian. */
  const point: (station: number) => [number, number, number] = (
    station: number,
  ): [number, number, number] => {
    const p: [number, number] = original.point(station, Math.PI);
    return [p[0], station, p[1]];
  };
  const points: [number, number, number][] = [];
  for (let station: number = waist; station < cervicale; station += 2)
    points.push(point(station));
  const actual: number = AutoMovieHumanTrunkCourses.taut(
    point(cervicale),
    point(waist),
    [-1, 0, 0],
    points,
  );
  if (!Number.isFinite(actual))
    throw new Error("Actual original back-neck/waist tape is not finite");
  return {
    name: constraint.name,
    target: constraint.target,
    scope: "S00-only",
    actual,
    residual: actual - constraint.target,
    method: "sampled-original-taut-course",
    station: null,
    points: points.length + 2,
    detail:
      "Existing ISO 8559-1 5.4.5 posterior-median course and unchanged 2 mm observations, fed the actual S00 original between its real C7 course and supplied waist height. The polygon taut-tape law is unchanged; this is no continuous-error or solved-constraint certificate.",
  };
}
