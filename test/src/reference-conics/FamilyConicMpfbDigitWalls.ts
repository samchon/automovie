import {
  AutoMovieNaturalSpline,
  AutoMovieViewHermite,
} from "@automovie/engine";
import {
  AutoMovieHumanConicSection as Conic,
  AutoMovieHumanCourseRuns as CourseRuns,
  AutoMovieHumanConicLoft as Loft,
  AutoMovieHumanLoftStations as Stations,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieViewHermite,
  AutoMovieVector2Tuple as P2,
} from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicMpfbDigits as Digits } from "./FamilyConicMpfbDigits";
import { FamilyConicMpfbFamilies as Families } from "./FamilyConicMpfbFamilies";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";

/**
 * Starter walls for the axial digits, from source skin on their own rounded
 * courses.
 */
export namespace FamilyConicMpfbDigitWalls {
  /** One authoritative source reading in a transported course chart. */
  interface IRow {
    station: number;
    origin: P2;
    values: number[];
  }

  /** One source-share flattening before the fitted material is protected. */
  interface IShareCorrection {
    /** Ordinate in the bare conic layout. */
    field: number;
    /** Fraction of the canonical quarter ellipse mixed into the source. */
    blend: number;
    /** Continuous bounds of the measured scalar before flattening. */
    raw: [number, number];
  }

  /** One provisional unjoined wall and the evidence supporting its extent. */
  export interface IWall {
    /** Anatomical side of this wall. */
    side: Digits.Side;
    /** Host region that carries this digit. */
    kind: Digits.Kind;
    /** Anatomical name in the Human digit vocabulary. */
    name: string;
    /** Directly measured section stations in the selected course run, in mm. */
    stations: number[];
    /** Every refused plane on the rounded course in the sampled span. */
    refused: { station: number; reason: string }[];
    /**
     * The independent fields where a run supplies at least two distinct
     * controls.
     */
    family: IAutoMovieHumanConicLoft.IFamily | null;
    /** Existing loft admission verdict for the provisional wall. */
    refusal: string | null;
    /** Shape-preserving corrections that preceded the protected wall. */
    correctedShares?: IShareCorrection[];
  }

  /**
   * Include every measured shoulder extremum the natural interpolation would
   * otherwise move beyond its conic domain. A cubic is fixed by the original
   * values and its natural knot jets. The Hermite form reproduces that cubic
   * and exposes its interior zero-slope parameters.
   */
  function refineShares(
    observed: IRow[],
    read: (station: number) => IRow,
  ): { rows: IRow[]; corrections: IShareCorrection[] } | string {
    let rows: IRow[] = observed;
    const corrections: IShareCorrection[] = [];
    const minimum: number = 0.25;
    for (;;) {
      const stations: number[] = rows.map(({ station }): number => station);
      const extra: number[] = [];
      const flatten: {
        field: number;
        bounds: [number, number];
        values: number[];
      }[] = [];
      for (const field of [8, 9, 10, 11]) {
        const values: number[] = rows.map(
          ({ values }): number => values[field]!,
        );
        if (values.some((value): boolean => !(value > 0 && value < 1)))
          return "An observed quarter shoulder is outside (0, 1)";
        const spline = AutoMovieNaturalSpline.create(stations, values);
        const curve: IAutoMovieViewHermite.ICurve | string =
          AutoMovieViewHermite.create(
            spline,
            stations.map((station, i) => ({
              station,
              value: values[i]!,
              site: "digit shoulder " + i,
            })),
            undefined,
          );
        if (typeof curve === "string") return curve;
        const critical = AutoMovieViewHermite.critical(curve).map(
          (station): { station: number; value: number } => ({
            station,
            value: AutoMovieNaturalSpline.evaluate(spline, station),
          }),
        );
        const violations = critical.filter(
          ({ value }): boolean => !(value > 0 && value < 1),
        );
        if (violations.length === 0) continue;
        if (
          violations.some(({ station }): boolean =>
            stations.some((s): boolean => Math.abs(s - station) < minimum),
          )
        ) {
          const all: number[] = [
            ...values,
            ...critical.map(({ value }): number => value),
          ];
          flatten.push({
            field,
            bounds: [Math.min(...all), Math.max(...all)],
            values,
          });
        } else {
          extra.push(...violations.map(({ station }): number => station));
        }
      }
      if (extra.length === 0 && flatten.length === 0)
        return { rows, corrections };

      // Match the original loft's 0.25 mm physical refinement floor.
      // Finer facet slices have no new independent curvature information.
      const incoming: IRow[] = [];
      for (const station of [...new Set(extra)].sort((a, b): number => a - b)) {
        if (
          incoming.some(
            (row): boolean => Math.abs(row.station - station) < minimum,
          )
        )
          continue;
        try {
          incoming.push(read(station));
        } catch (error: unknown) {
          return (
            "A shoulder extremum has no independent source cut at " +
            station +
            " mm: " +
            (error instanceof Error ? error.message : String(error))
          );
        }
      }
      if (incoming.length > 0) {
        rows = [...rows, ...incoming].sort(
          (a, b): number => a.station - b.station,
        );
        continue;
      }
      // The natural spline is linear in its ordinates. Blend only an
      // underresolved share toward the quarter ellipse, just far enough
      // to leave half the nearest measured margin at the continuous extrema.
      rows = rows.map((row): IRow => ({ ...row, values: [...row.values] }));
      const quarter: number = Math.SQRT2 - 1;
      for (const { field, bounds, values } of flatten) {
        const [lo, hi]: [number, number] = bounds;
        const margin: number =
          Math.min(Math.min(...values), 1 - Math.max(...values)) / 2;
        const blend: number = Math.max(
          lo < margin ? (margin - lo) / (quarter - lo) : 0,
          hi > 1 - margin ? (hi - (1 - margin)) / (hi - quarter) : 0,
        );
        for (const row of rows)
          row.values[field] =
            (1 - blend) * row.values[field]! + blend * quarter;
        corrections.push({ field, blend, raw: bounds });
      }
    }
  }

  /**
   * Read skin on the actual course, including the straight tangent beyond its
   * last rig marker.
   */
  function sample(
    name: string,
    course: Families.Course,
    cut: Families.Cut,
    foreign: readonly Families.Segment[],
  ): Omit<IWall, "side" | "kind" | "name"> {
    const axis = Loft.axis(course);
    const ends: number[] = CourseRuns.joints(course.centres, course.halves);
    const spans: number[] = ends
      .slice(1)
      .map((end, index): number => end - ends[index]!);
    const step: number = Math.min(
      Stations.BODY_PITCH_MM,
      Math.min(...spans) / 2,
    );
    // The body station pitch and half the shortest phalanx span bound the
    // section spacing. ESTIMATE: one final span locates the tip neighbourhood
    // when the skin extends beyond the last skeletal marker.
    const limit: number = ends.at(-1)! + spans.at(-1)!;
    const intervals: number = Math.ceil(limit / step);
    const refused: IWall["refused"] = [];
    const runs: IRow[][] = [[]];
    const read = (station: number): IRow => {
      const { origin, points } = Families.centred(
        cut(axis.at(station), foreign),
        false,
      );
      const values: number[] = Families.fields(points, false);
      if (!values.every(Number.isFinite))
        throw new Error("No finite conic guides in the observed section");
      return { station, origin, values };
    };
    for (let i: number = 0; i <= intervals; ++i) {
      const station: number = (limit * i) / intervals;
      try {
        runs.at(-1)!.push(read(station));
      } catch (error: unknown) {
        refused.push({
          station,
          reason: error instanceof Error ? error.message : String(error),
        });
        if (runs.at(-1)!.length > 0) runs.push([]);
      }
    }
    // A short isolated proximal loop can precede a shared web. Use the longest
    // contiguous sampled run, preferring the distal one at equal length.
    const coarse: IRow[] = runs.reduce((best, run): IRow[] =>
      run.length >= best.length ? run : best,
    );
    if (coarse.length < 2)
      return {
        stations: coarse.map(({ station }): number => station),
        refused,
        family: null,
        refusal: "Fewer than two consecutive independent section controls",
      };
    const refined = refineShares(coarse, read);
    if (typeof refined === "string")
      return {
        stations: coarse.map(({ station }): number => station),
        refused,
        family: null,
        refusal: refined,
      };
    const { rows, corrections } = refined;
    const stations: number[] = rows.map(({ station }): number => station);
    const family: IAutoMovieHumanConicLoft.IFamily = {
      name,
      ...course,
      layout: Conic.limb(0),
      knots: stations,
      values: rows[0]!.values.map((_, field): number[] =>
        rows.map(({ values }): number => values[field]!),
      ),
      origin: {
        u: rows.map(({ origin }): number => origin[0]),
        v: rows.map(({ origin }): number => origin[1]),
      },
      rootSectionMark: stations[0],
    };
    try {
      const check = Loft.create(family, stations);
      const refusal: string | null =
        check.chain === null || check.diagnostics.length > 0
          ? JSON.stringify(check.diagnostics)
          : null;
      return {
        stations,
        refused,
        family,
        refusal,
        correctedShares: corrections,
      };
    } catch (error: unknown) {
      return {
        stations,
        refused,
        family,
        refusal: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Replay the closed source cuts on the digit's production course chart. Each
   * wall retains its own measured run and loft verdict.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Field ordinates are measured on the same course the provisional loft uses. The first independent field stays available as the future protected start.
   * @evidence contracts/development/implementation.md#efficient-algorithms One prepared source cut query serves all candidate walls.
   */
  export function build(
    source: Mpfb.IGeometry,
    reads: readonly Digits.IRead[],
  ): IWall[] {
    const cut: Families.Cut = Families.prepareCut(source);
    return reads.flatMap(({ side, kind, host, digits }): IWall[] => {
      const bones: Families.Segment[][] = digits.map(
        ({ joints }): Families.Segment[] =>
          Digits.supportedSegments(source, joints, host.sections[0]!.frame),
      );
      return digits.flatMap(({ name, course }, index): IWall[] => {
        if (name === "finger.thumb") return [];
        if ("refusal" in course)
          return [
            {
              side,
              kind,
              name,
              stations: [],
              refused: [],
              family: null,
              refusal: course.refusal,
            },
          ];
        const foreign: Families.Segment[] = bones.flatMap(
          (segments, i): Families.Segment[] => (index === i ? [] : segments),
        );
        return [{ side, kind, name, ...sample(name, course, cut, foreign) }];
      });
    });
  }

  /**
   * Generate a public-source starter-wall receipt for offline joint
   * preparation.
   */
  export async function main(): Promise<void> {
    const out: string | undefined = process.argv[2];
    if (out === undefined)
      throw new Error(
        "Usage: FamilyConicMpfbDigitWalls <receipt.json> [exact-hm08-obj]",
      );
    const { source, ...geometry } = await Mpfb.load(process.argv[3]);
    const measurements: Digits.IRead[] = Digits.measure(geometry);
    const started: number = performance.now();
    const walls: IWall[] = build(geometry, measurements);
    const milliseconds: number = performance.now() - started;
    await mkdir(path.dirname(path.resolve(out)), { recursive: true });
    await writeFile(
      out,
      JSON.stringify(
        { asset: source, pose: "HM08 rest", milliseconds, walls },
        null,
        2,
      ) + "\n",
    );
    console.log(
      JSON.stringify(
        walls.map(({ side, name, stations, refusal }) => ({
          side,
          name,
          observed: stations.length,
          from: stations[0],
          to: stations.at(-1),
          refusal,
        })),
      ),
    );
  }
}

if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module &&
  path.parse(process.argv[1] ?? "").name === "FamilyConicMpfbDigitWalls"
)
  FamilyConicMpfbDigitWalls.main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
