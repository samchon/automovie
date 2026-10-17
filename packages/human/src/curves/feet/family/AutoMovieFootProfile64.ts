import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { AutoMovieFootMath64 as M } from "./AutoMovieFootMath64";
import type { IAutoMovieFootDimensions64 as D } from "./IAutoMovieFootDimensions64";

/** Shared support equations for main-foot courses and their toe-branch consumers. */
export namespace AutoMovieFootProfile64 {
  /** Angular support order, beginning at the anatomical lateral wall. */
  export const names: readonly string[] = [
    "outer",
    "upperOuter",
    "dorsum",
    "upperInner",
    "inner",
    "plantarInner",
    "sole",
    "plantarOuter",
  ];

  /**
   * Expand one dimensional profile into local outward/up/forward millimetres.
   * Height fractions interpolate between the supplied plantar and dorsal heights;
   * absent optional fractions omit their supports. This constructs no skin.
   */
  export function profile(
    p: D.Profile,
    center: number,
    width: number,
    sole: number,
    top: number,
    w: number,
  ): Record<string, C.Vector> {
    const inner: number = center - width / 2;
    const outer: number = center + width / 2;
    const height: number = top - sole;
    const peak: number = inner + width * p.roofPeakFraction;
    const contact: number = inner + width * p.soleContactFraction;
    const points: Record<string, C.Vector> = {
      outer: [outer, sole + height * p.outerWallHeightFraction, w],
      dorsum: [peak, top, w],
      inner: [inner, sole + height * p.innerWallHeightFraction, w],
      sole: [contact, sole, w],
    };
    const optional: [string, number, number | undefined][] = [
      ["upperOuter", (outer + peak) / 2, p.upperOuterHeightFraction],
      ["upperInner", (inner + peak) / 2, p.upperInnerHeightFraction],
      ["plantarInner", (inner + contact) / 2, p.plantarInnerHeightFraction],
      ["plantarOuter", (outer + contact) / 2, p.plantarOuterHeightFraction],
    ];
    for (const [name, u, h] of optional)
      if (h !== undefined) points[name] = [u, sole + height * h, w];
    return points;
  }

  /**
   * Apply one main-course recipe, including the existing medial arch band.
   * The returned local supports are used both by generation and by the public
   * toe mapper's actual parent section. The 0.8-forward-reach band remains a
   * geometric convention, not a measured anatomical boundary.
   */
  export function main(
    p: D.Course,
    dimensions: D.Dimensions,
    w: number,
  ): Record<string, C.Vector> {
    const floor: number = dimensions.floorOffsetAlongLocalUp_mm;
    const points: Record<string, C.Vector> = profile(
      p,
      dimensions.breadth_mm * p.centerOutwardRatio,
      dimensions.breadth_mm * p.breadthRatio,
      floor + p.soleHeightAboveFloor_mm,
      floor + dimensions.instepHeight_mm * p.dorsalHeightRatio,
      w,
    );
    if (w > 0 && w < dimensions.forefootWebReach_mm * 0.8) {
      points.plantarInner = [
        points.plantarInner![0],
        floor + dimensions.medialArchHeight_mm * p.plantarInnerArchRatio,
        w,
      ];
      points.inner = [
        points.inner![0],
        floor + dimensions.medialArchHeight_mm * p.innerArchRatio,
        w,
      ];
    }
    return points;
  }

  /**
   * Join the eight main supports with the same angular tangents used at generation.
   * Inputs may be local or world millimetres when up/outward use that same chart.
   * The caller supplies a closed forefoot course, rather than a collar-cut rear row.
   */
  export function closed(
    points: Readonly<Record<string, C.Vector>>,
    up: C.Vector,
    outward: C.Vector,
  ): C.Span[] {
    return M.course(
      names.map((name: string): C.Vector => points[name]!),
      true,
      up,
      { 0: up, 2: M.mul(outward, -1), 4: M.mul(up, -1), 6: outward },
    );
  }
}
