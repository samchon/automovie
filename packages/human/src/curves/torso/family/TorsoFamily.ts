import {
  AutoMovieClampedTailField64,
  AutoMoviePchipField64,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { ITorsoMeasurements as T } from "./ITorsoMeasurements";
import { TorsoMath as M } from "./TorsoMath";

/** One twelve-lane section family and its physical-height derivatives. Common angular widths are mean semantic chord lengths across all courses, so changing one course can change other courses' handles. Clamped cubic height fields interpolate supports and one-third angular derivatives with continuous interior curvature, retaining the original waist endpoint derivative in a local frame before their coefficients are placed once in world space. */
export class TorsoFamily {
  /** Insertion-ordered course names and local physical heights in millimetres; the first row is the lower derivative support. */
  public readonly rows: readonly {
    /** Semantic course name retained with its ordered physical-height row. */
    name: string;

    /** Local physical height in millimetres of this ordered course row. */
    y: number;
  }[];

  /** Positive cyclic angular widths normalized to mean one, with total twelve. Canonical boundary publication separately converts this chart to one turn. */
  public readonly widths: readonly number[];

  /** Physical-height clamped cubic coefficients for the twelve supports, transformed into the resolved world gauge. */
  private readonly points: AutoMovieClampedTailField64;

  /** Physical-height clamped cubic coefficients for one-third angular derivatives in the same world gauge, without translation. */
  private readonly handles: AutoMovieClampedTailField64;

  /**
   * Resolve support/handle interpolation and apply the owning gauge to polynomial coefficients. Measures must supply increasing rows and consistent twelve-lane records.
   *
   * @param measures Internal dimensions and common section conventions.
   * @param origin World origin in millimetres.
   * @param basis Proper world basis columns in subject-left, up, front order.
   */
  public constructor(
    measures: T.Value,
    origin: C.Vector,
    basis: readonly C.Vector[],
  ) {
    const entries: readonly [string, T.Section][] = Object.entries(
        measures.sections,
      ),
      length: number = measures.trunkLengthMm;
    const depthKeys: readonly (keyof T.Section)[] = [
      "leftFlankDepthRatio",
      "leftAnteriorRootInnerDepthRatio",
      "leftAnteriorRootOuterDepthRatio",
      "leftAnteriorDepthRatio",
      "medianAnteriorDepthRatio",
      "rightAnteriorDepthRatio",
      "rightAnteriorRootOuterDepthRatio",
      "rightAnteriorRootInnerDepthRatio",
      "rightFlankDepthRatio",
      "rightPosteriorDepthRatio",
      "medianPosteriorDepthRatio",
      "leftPosteriorDepthRatio",
    ];
    this.rows = entries.map(
      ([name, s]: [string, T.Section]): {
        /** Semantic course name retained with its ordered physical-height row. */
        name: string;

        /** Local physical height in millimetres of this ordered course row. */
        y: number;
      } => ({ name, y: s.heightRatio * length }),
    );
    const supports: C.Vector[][] = entries.map(
      ([, s]: [string, T.Section]): C.Vector[] => {
        const cx: number = s.centerLateralRatio * length,
          b: number = s.halfBreadthRatio * length,
          af: readonly [number, number] = measures.pairedLaneRatios.anterior,
          ab: readonly [number, number] = measures.pairedLaneRatios.posterior;
        const x: readonly number[] = [
          cx + b,
          cx + b * s.leftRootInnerXRatio,
          cx + b * s.leftRootOuterXRatio,
          cx + b * af[0],
          0,
          cx - b * af[1],
          cx - b * s.rightRootOuterXRatio,
          cx - b * s.rightRootInnerXRatio,
          cx - b,
          cx - b * ab[1],
          0,
          cx + b * ab[0],
        ];
        return x.map(
          (v: number, j: number): C.Vector => [
            v,
            s.heightRatio * length,
            s[depthKeys[j]!]! * length,
          ],
        );
      },
    );
    const chords: number[] = supports[0]!.map(
        (_: C.Vector, j: number): number =>
          supports.reduce(
            (sum: number, row: readonly C.Vector[]): number =>
              sum + M.length(M.sub(row[(j + 1) % 12]!, row[j]!)),
            0,
          ) / supports.length,
      ),
      mean: number =
        chords.reduce((a: number, b: number): number => a + b, 0) / 12;
    this.widths = chords.map((chord: number): number => chord / mean);
    const phase: number[] = M.cumulative(this.widths),
      total: number = phase.at(-1)!;
    const handles: C.Vector[][] = supports.map(
      (p: readonly C.Vector[], i: number): C.Vector[] => {
        const angular: AutoMoviePchipField64 = new AutoMoviePchipField64(
          [-this.widths[11]!, ...phase, total + this.widths[0]!],
          [p[11]!, ...p, p[0]!, p[1]!],
        );
        const gain: { flank: number; anterior: number; posterior: number } =
          measures.sectionFullness[this.rows[i]!.name]!;
        return p.map(
          (_: C.Vector, j: number): C.Vector =>
            M.mul(
              angular.at(phase[j]!, true) as unknown as C.Vector,
              (j === 0 || j === 8
                ? gain.flank
                : j < 8
                  ? gain.anterior
                  : gain.posterior) / 3,
            ),
        );
      },
    );
    const y: number[] = this.rows.map(
      (row: { name: string; y: number }): number => row.y,
    );
    this.points = new AutoMovieClampedTailField64(
      y,
      supports.map((p: readonly C.Vector[]): number[] => p.flat()),
    );
    this.handles = new AutoMovieClampedTailField64(
      y,
      handles.map((p: readonly C.Vector[]): number[] => p.flat()),
    );
    // Resolve each generating coefficient once, before section/guide construction.
    for (const [field, translation] of [
      [this.points, origin],
      [this.handles, [0, 0, 0] as C.Vector],
    ] as const)
      for (const interval of field.coefficients)
        for (let lane: number = 0; lane < 12; lane++)
          for (let degree: number = 0; degree < 4; degree++) {
            let value: C.Vector = M.columns(basis, [
              interval[3 * lane]![degree]!,
              interval[3 * lane + 1]![degree]!,
              interval[3 * lane + 2]![degree]!,
            ]);
            if (degree === 3) value = M.add(value, translation);
            for (let axis: number = 0; axis < 3; axis++)
              interval[3 * lane + axis]![degree] = value[axis]!;
          }
  }

  /** Evaluate the closed twelve-span section at local height y in millimetres. With derivative=true, every returned control is the derivative of its section control with respect to y, in mm/mm; it is not another position section. */
  public controls(y: number, derivative: boolean = false): C.Span[] {
    return M.spans(
      M.unflatten(this.points.at(y, derivative)),
      M.unflatten(this.handles.at(y, derivative)),
      this.widths,
    );
  }

  /** Evaluate one section span at local t in [0,1]. Sector follows the fixed twelve-lane cyclic order, and y is local physical height in millimetres. */
  public sample(y: number, sector: number, t: number = 0): C.Vector {
    return M.bez(this.controls(y)[sector]!, t);
  }

  /** Construct an exact cubic height restriction at a fixed angular sector/t. Ordered ys must split at the family's Hermite interval boundaries; widths are physical millimetres and derivatives are dP/dy. */
  public longitudinal(
    sector: number,
    t: number,
    ys: readonly number[],
  ): C.Span[] {
    return ys.slice(0, -1).map((a: number, i: number): C.Span => {
      const b: number = ys[i + 1]!;
      return M.hermite(
        this.sample(a, sector, t),
        this.sample(b, sector, t),
        M.bez(this.controls(a, true)[sector]!, t),
        M.bez(this.controls(b, true)[sector]!, t),
        b - a,
      );
    });
  }
}
