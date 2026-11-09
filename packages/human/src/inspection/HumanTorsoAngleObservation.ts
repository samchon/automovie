import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieNativeCoordinate,
  AutoMovieViewCurves,
} from "@automovie/engine";

import { AutoMovieHumanTorsoSource } from "../generation/trunk/AutoMovieHumanTorsoSource";
import type { AutoMovieHumanTorsoClosure } from "../generation/trunk/AutoMovieHumanTorsoClosure";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { HumanTorsoObservation } from "./HumanTorsoObservation";
import { NodeCanvasCamera } from "./NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./NodeCanvasTypes";

/** Selected actual thorax originals and datums in multiple existing-raster camera directions, with no shape edit or raw loft. */
export namespace HumanTorsoAngleObservation {
  /** Same original family produces all wall/composed/close-up selections and their failure records. */
  export function create(
    parameters: IAutoMovieHumanParameters,
    available?: AutoMovieHumanTorsoSource.IOutput,
    work?: AutoMovieHumanTorsoClosure.IWork,
  ): HumanTorsoObservation.IOutput {
    const started: number = performance.now();
    const candidate: AutoMovieHumanTorsoSource.IOutput =
      available ?? AutoMovieHumanTorsoSource.create(parameters);
    // This selected constraint-observation stage requests closure explicitly.
    // The original-only entry still exposes the unclosed candidate directly.
    const original: AutoMovieHumanTorsoSource.IOutput =
      AutoMovieHumanTorsoSource.close(candidate, work);
    const preparedAt: number = performance.now();
    const multiplier: number = 1 / (original.plan.scale * 1000);
    const waist: number =
      original.plan.measures.waistHeight * original.plan.scale;
    const low: number = Math.max(waist, original.plan.domain[0]);
    const high: number = original.plan.domain[1];
    const marks: number[] = [
      ...new Set([
        low,
        ...original.wall.stations.filter(
          (s: number): boolean => s > low && s < high,
        ),
        high,
      ]),
    ];
    const stations: number[] = marks.flatMap(
      (s: number, at: number): number[] =>
        at + 1 === marks.length
          ? [s]
          : Array.from(
              { length: 16 },
              (_: unknown, step: number): number =>
                s + ((marks[at + 1]! - s) * step) / 16,
            ),
    );
    const diagnostics: { id: string; detail: string }[] = [];
    const wall: N.Curve[] = [];
    const composed: N.Curve[] = [];
    const sections: N.Curve[] = [];
    const breast: N.Curve[] = [];
    const datums: N.Curve[] = [];
    let frontCourse: HumanTorsoObservation.ICourse | undefined;
    const courseStarted: number = performance.now();
    try {
      frontCourse = HumanTorsoObservation.course(original);
      composed.push(...frontCourse.curves);
      if (frontCourse.failure !== undefined) diagnostics.push({ id: "S00.course.side-neck-bust", detail: frontCourse.failure });
    } catch (error: unknown) {
      diagnostics.push({ id: "S00.course.side-neck-bust", detail: error instanceof Error ? (error.stack ?? error.message) : String(error) });
    }
    const courseObservationMilliseconds: number = frontCourse?.milliseconds.sourceCourse ?? performance.now() - courseStarted;

    /** Same calibration-to-display conversion for source and datum drawings. */
    const scaled: (p: readonly number[]) => N.Point = (
      p: readonly number[],
    ): N.Point => [p[0]! * multiplier, p[1]! * multiplier, p[2]! * multiplier];

    /** Failed originals remain named; a partial polyline is never substituted. */
    const append: (
      target: N.Curve[],
      id: string,
      closed: boolean,
      colour: string,
      read: () => N.Point[],
    ) => void = (
      target: N.Curve[],
      id: string,
      closed: boolean,
      colour: string,
      read: () => N.Point[],
    ): void => {
      try {
        const points: N.Point[] = read();
        if (
          points.length < 2 ||
          points.some((p: N.Point): boolean => !p.every(Number.isFinite))
        )
          throw new Error(
            "Actual thorax original has no complete finite display curve",
          );
        target.push({ id, closed, colour, points });
      } catch (error: unknown) {
        diagnostics.push({
          id,
          detail:
            error instanceof Error
              ? (error.stack ?? error.message)
              : String(error),
        });
      }
    };
    const edges: ReturnType<typeof AutoMovieViewCurves.create> =
      AutoMovieViewCurves.create(original.wall);
    diagnostics.push(
      ...edges.diagnostics.map(
        (
          fault: (typeof edges.diagnostics)[number],
        ): { id: string; detail: string } => ({
          id: "S00.wall",
          detail: JSON.stringify(fault),
        }),
      ),
    );
    for (const edge of edges.curves)
      append(
        wall,
        "S00.wall.original." + edge.name,
        false,
        "205c99",
        (): N.Point[] =>
          stations.map((s: number): N.Point => {
            const read: ReturnType<typeof AutoMovieViewCurves.at> =
              AutoMovieViewCurves.at(edge, original.wall.axis, s);
            if (typeof read === "string") throw new Error(read);
            return scaled(read.point);
          }),
      );
    for (const guide of original.guides.filter(
      (item: AutoMovieHumanTorsoSource.IGuide): boolean =>
        item.region === "trunk" || item.region.startsWith("breast."),
    )) {
      const from: number = Math.max(low, guide.domain[0]);
      const to: number = Math.min(high, guide.domain[1]);
      if (!(from < to)) continue;
      append(
        guide.region === "trunk" ? composed : breast,
        "S00.composed.original." + guide.id,
        false,
        guide.region === "trunk" ? "d32698" : "32813d",
        (): N.Point[] =>
          [
            from,
            ...stations.filter((s: number): boolean => s > from && s < to),
            to,
          ].map((s: number): N.Point => scaled(guide.point(s))),
      );
    }
    for (const name of ["collar.start", "neck.base", "neck.normal"] as const)
      append(
        composed,
        "S00.composed.course." + name,
        true,
        "a67b13",
        (): N.Point[] =>
          Array.from({ length: 128 }, (_: unknown, index: number): N.Point => {
            const clock: number = (2 * Math.PI * index) / 128;
            const s: number =
              name === "collar.start"
                ? original.collar.start(clock)[0]
                : name === "neck.base"
                  ? original.plan.neckFamily.height(clock)[0]
                  : original.plan.neckFamily.normalHeight(clock)[0];
            const p: [number, number] = original.point(s, clock);
            return scaled([p[0], s, p[1]]);
          }),
      );
    const admitted: ReturnType<typeof AutoMovieLoftViewSource.create> =
      AutoMovieLoftViewSource.create(original.wall);
    if (admitted === null || admitted.source === null)
      throw new Error("Actual thorax wall has no original scalar family");
    const native: AutoMovieLoftViewSource.ISource = admitted.source;
    for (const site of original.plan.wall.sites.filter(
      (
        site: AutoMovieHumanTorsoSource.IOutput["plan"]["wall"]["sites"][number],
      ): boolean =>
        ["waist", "underbust", "chest", "axilla", "acromion"].includes(
          site.site,
        ),
    )) {
      append(
        sections,
        "S00.composed.plane." + site.site,
        true,
        "d32698",
        (): N.Point[] =>
          Array.from({ length: 256 }, (_: unknown, at: number): N.Point => {
            const p: [number, number] = original.point(
              site.y,
              (2 * Math.PI * at) / 256,
            );
            return scaled([p[0], site.y, p[1]]);
          }),
      );
      append(
        wall,
        "S00.wall.plane." + site.site,
        true,
        "205c99",
        (): N.Point[] => {
          const values: ReturnType<typeof AutoMovieLoftViewRead.values> =
            AutoMovieLoftViewRead.values(native, site.y);
          if (typeof values === "string") throw new Error(values);
          const point: ReturnType<typeof AutoMovieLoftSectionNative.point> =
            AutoMovieLoftSectionNative.point(values);
          const frame: ReturnType<typeof original.wall.axis.at> =
            original.wall.axis.at(site.y);
          return Array.from(
            { length: 256 },
            (_: unknown, at: number): N.Point => {
              const p: [number, number] = point((2 * Math.PI * at) / 256);
              return scaled(
                frame.origin.map(
                  (v: number, coordinate: number): number =>
                    v +
                    frame.u[coordinate]! * p[0] +
                    frame.v[coordinate]! * p[1],
                ),
              );
            },
          );
        },
      );
    }
    for (const region of original.plan.regions.filter(
      (
        region: AutoMovieHumanTorsoSource.IOutput["plan"]["regions"][number],
      ): boolean => region.name.startsWith("breast."),
    )) {
      append(
        datums,
        region.name + ".datum.apex.vertical",
        false,
        "111111",
        (): N.Point[] =>
          [-3, 3].map(
            (dy: number): N.Point =>
              scaled([region.apex[0], region.apex[1] + dy, region.apex[2]]),
          ),
      );
      append(
        datums,
        region.name + ".datum.apex.lateral",
        false,
        "111111",
        (): N.Point[] =>
          [-3, 3].map(
            (dz: number): N.Point =>
              scaled([region.apex[0], region.apex[1], region.apex[2] + dz]),
          ),
      );
      append(
        breast,
        region.name + ".original.footprint-rim",
        true,
        "e89013",
        (): N.Point[] =>
          Array.from({ length: 128 }, (_: unknown, at: number): N.Point => {
            const clock: number = (2 * Math.PI * at) / 128;
            const s: number =
              region.apex[1] +
              inverse(
                Math.cos(clock),
                region.footprint[0],
                region.footprint[2],
              );
            const z: number =
              region.apex[2] +
              region.side *
                inverse(
                  Math.sin(clock),
                  region.footprint[1],
                  region.footprint[3],
                );
            const values: ReturnType<typeof AutoMovieLoftViewRead.values> =
              AutoMovieLoftViewRead.values(native, s);
            if (typeof values === "string") throw new Error(values);
            const frame: ReturnType<typeof original.wall.axis.at> =
              original.wall.axis.at(s);
            if (frame.u[2] !== 0 || frame.v[2] !== 1)
              throw new Error(
                "Actual footprint correspondence requires its existing upright wall chart",
              );
            let found: AutoMovieNativeCoordinate.IResult;
            try {
              found = AutoMovieNativeCoordinate.locate(
                values,
                1,
                1,
                z - frame.origin[2],
              );
            } catch (error: unknown) {
              // Preserve the first real refused target and both unchanged
              // native endpoints; an endpoint excess is never clamped here.
              const read: ReturnType<typeof AutoMovieLoftSectionNative.point> =
                AutoMovieLoftSectionNative.point(values);
              const endpoints: [number, number][] = [
                read(-Math.PI / 2), read(Math.PI / 2),
              ];
              throw new Error("Actual footprint original correspondence failed: " +
                JSON.stringify({ region: region.name, index: at, clock, station: s,
                  worldZ: z, localTarget: z - frame.origin[2], frame, values,
                  endpoints, reach: [Math.min(...endpoints.map((p: [number, number]): number => p[1])),
                    Math.max(...endpoints.map((p: [number, number]): number => p[1]))] }) +
                  "; original=" + (error instanceof Error ? (error.stack ?? error.message) : String(error)),
              { cause: error });
            }
            const p: [number, number] = original.point(s, found.phase);
            return scaled([p[0], s, p[1]]);
          }),
      );
    }
    const groups: { id: string; curves: N.Curve[]; orthographic: boolean }[] = [
      {
        id: "S00.thorax.composed",
        curves: [...composed, ...sections, ...breast, ...datums],
        orthographic: true,
      },
      {
        id: "S00.thorax.wall-and-composed",
        curves: [...wall, ...composed, ...sections, ...breast, ...datums],
        orthographic: false,
      },
      {
        id: "S00.thorax.breast-close",
        curves: [
          ...breast,
          ...datums,
          ...sections.filter((curve: N.Curve): boolean =>
            /\.(chest|underbust)$/.test(curve.id),
          ),
        ],
        orthographic: true,
      },
    ];
    const selections: HumanTorsoObservation.ISelection[] = groups.map(
      (group: (typeof groups)[number]): HumanTorsoObservation.ISelection => {
        const points: N.Point[] = group.curves.flatMap(
          (curve: N.Curve): N.Point[] => [...curve.points],
        );
        if (points.length === 0)
          throw new Error(
            "Actual thorax selection has no source points: " + group.id,
          );
        const cameras: N.Camera[] = [];
        for (const name of ["high-oblique", "low-oblique"])
          for (const quarter of [0, 1, 2, 3]) {
            const angle: number = (Math.PI * quarter) / 2;
            const fitted: N.Camera = NodeCanvasCamera.fit(
              name,
              points.map((p: N.Point): N.Point => rotate(p, -angle)),
            );
            cameras.push({
              ...fitted,
              name: name + ".yaw" + quarter * 90,
              target: rotate(fitted.target, angle),
              back: rotate(fitted.back, angle),
              right: rotate(fitted.right, angle),
              up: rotate(fitted.up, angle),
              annotations: false,
            });
          }
        if (group.orthographic)
          for (const name of ["front", "back", "left", "right"])
            cameras.push({
              ...NodeCanvasCamera.fit(name, points),
              annotations: false,
            });
        return { id: group.id, curves: group.curves, cameras };
      },
    );
    return {
      original,
      selections,
      diagnostics,
      provenance: {
        stage: "actual-thorax-originals-after-explicit-chest-and-front-course-closure",
        candidateConstraints: candidate.plan.constraints,
        constraints: original.plan.constraints,
        source: original.source.definition,
        axes: "+X anterior/+Y superior/+Z left; source coordinates remain unchanged",
        originalCapability: original.capability,
        palette: {
          wall: "205c99",
          composed: "d32698",
          breastMeridian: "32813d",
          actualFootprintRim: "e89013",
          apexDatum: "111111",
        },
        regions: original.plan.regions.filter(
          (
            region: AutoMovieHumanTorsoSource.IOutput["plan"]["regions"][number],
          ): boolean => region.name.startsWith("breast."),
        ),
        wallSites: original.plan.wall.sites,
        collarStart: original.plan.collarStart,
        namedBaseSites: original.plan.neckFamily.sites,
        frontCourse: frontCourse === undefined ? null : { endpoints: frontCourse.endpoints,
          reading: frontCourse.reading, failure: frontCourse.failure, failureQuery: frontCourse.failureQuery,
          straightLowerBound: frontCourse.straightLowerBound,
          meaning: "Actual sampled original-plane intersections and separate endpoint chord; no sampled polyline is labelled the continuous or taut course" },
        milliseconds: {
          originalPreparation: preparedAt - started,
          candidatePreparation: candidate.milliseconds,
          originalStages: original.plan.preparationMilliseconds,
          sourceStages: original.milliseconds,
          courseObservation: courseObservationMilliseconds,
          display: performance.now() - preparedAt - courseObservationMilliseconds,
        },
        sampling:
          "16 source-station display steps unchanged;256 per selected actual section;128 per actual course/footprint; no curve fitting or completed loft",
        reference:
          "Static gray native skin, independent of the generated originals and bind condition",
        cameras:
          "Existing Node fit cameras are yaw-rotated into world space; only fitting coordinates rotate, never source/reference buffers.",
        unverified: [
          "global original regularity",
          "coupled girths/courses",
          "actual production profile/bands",
          "raw loft",
          "final skin",
          "binding",
          "anatomical acceptance",
        ],
      },
    };
  }
}

/** Exact inverse of the authored asymmetric rational footprint coordinate, without a clamp. */
function inverse(value: number, positive: number, negative: number): number {
  return (
    (2 * positive * negative * value) /
    (positive + negative - (positive - negative) * value)
  );
}

/** Rigid camera-fit coordinate transform, never applied to emitted source/reference geometry. */
function rotate(point: N.Point, angle: number): N.Point {
  const c: number = Math.cos(angle);
  const s: number = Math.sin(angle);
  return [c * point[0] + s * point[2], point[1], -s * point[0] + c * point[2]];
}
