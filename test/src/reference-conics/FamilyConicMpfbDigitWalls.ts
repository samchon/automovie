import {
  AutoMovieHumanConicSection as Conic,
  AutoMovieHumanCourseRuns as CourseRuns,
  AutoMovieHumanConicLoft as Loft,
  AutoMovieHumanLoftStations as Stations,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
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
    for (let i: number = 0; i <= intervals; ++i) {
      const station: number = (limit * i) / intervals;
      try {
        const { origin, points } = Families.centred(
          cut(axis.at(station), foreign),
          false,
        );
        const values: number[] = Families.fields(points, false);
        if (!values.every(Number.isFinite))
          throw new Error("No finite conic guides in the observed section");
        runs.at(-1)!.push({ station, origin, values });
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
    const rows: IRow[] = runs.reduce((best, run): IRow[] =>
      run.length >= best.length ? run : best,
    );
    const stations: number[] = rows.map(({ station }): number => station);
    if (rows.length < 2)
      return {
        stations,
        refused,
        family: null,
        refusal: "Fewer than two consecutive independent section controls",
      };
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
      return { stations, refused, family, refusal };
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
    return reads.flatMap(({ side, kind, digits }): IWall[] => {
      const bones: Families.Segment[][] = digits.map(
        ({ joints }): Families.Segment[] => Families.segments(source, joints),
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
