import {
  type IAutoMovieCurve64 as C,
  assertAutoMovieCurve64,
  evaluateAutoMovieCurve64,
} from "@automovie/engine";

import type { IAutoMovieHumanConstructionNet } from "../structures/IAutoMovieHumanConstructionNet";
import { describeAutoMovieCurveDesignRole } from "./describeAutoMovieCurveDesignRole";

/** Adapt generated binary64 primitives to the existing Human construction viewer seam.
 * The generating controls remain authoritative; only this display output is sampled
 * and converted once from millimetres to metres. It contains no skin or cage faces.
 */
export function inspectAutoMovieCurve64(
  part: string,
  side: "left" | "right" | null,
  curves: readonly C.Primitive[],
  describe?: (curve: C.Primitive) => {
    kind: IAutoMovieHumanConstructionNet.Kind;
    designRole: NonNullable<
      IAutoMovieHumanConstructionNet.ICurve["designRole"]
    >;
    designQualification: string;
  },
): IAutoMovieHumanConstructionNet {
  const result: IAutoMovieHumanConstructionNet = {
    part,
    side,
    curves: [],
    cage: { positions: [], edges: [], controlRole: "bezier-controls" },
  };
  for (const curve of curves) {
    assertAutoMovieCurve64(curve);
    const points: number[] = [];
    if (curve.type === "analyticOval") {
      for (let i: number = 0; i < 192; i++)
        points.push(
          ...evaluateAutoMovieCurve64(curve, i / 192).point.map(
            (x: number): number => x / 1000,
          ),
        );
    } else {
      let start: number = 0;
      const intervals: number = curve.type === "cubicBezier" ? 64 : 128;
      for (const width of curve.phaseIntervals) {
        for (let i: number = 0; i < intervals; i++)
          points.push(
            ...evaluateAutoMovieCurve64(
              curve,
              start + width * (i / intervals),
            ).point.map((x: number): number => x / 1000),
          );
        start += width;
      }
      if (!curve.closed)
        points.push(
          ...evaluateAutoMovieCurve64(curve, start).point.map(
            (x: number): number => x / 1000,
          ),
        );
    }
    const description: ReturnType<NonNullable<typeof describe>> | undefined =
      describe?.(curve);
    const designRole: IAutoMovieHumanConstructionNet.ICurve["designRole"] =
      description?.designRole ??
      describeAutoMovieCurveDesignRole(part, curve.name);
    const designQualification: string =
      description?.designQualification ??
      (part === "chest-waist-shoulder" &&
      /^(left|right)\.pairedMassLowerBorder\.proxy$/.test(curve.name)
        ? "Separate lower-mass proxy on the generating torso family, approximated by piecewise Hermite curves. It is not a measured inframammary or pectoral crease; selected-sample error is not a continuous error bound."
        : designRole === "unspecified"
          ? "The owner has not classified this course. Its name does not establish an exterior contour or clinical feature."
          : "The role describes the generating construction. It does not establish a measured anatomical border, accepted exterior contour or skin generated from these curves.");
    result.curves.push({
      kind: description?.kind ?? "curve",
      designRole,
      designQualification,
      name: curve.name,
      closed: curve.closed,
      points,
    });
    // Positive rational weights make their Euclidean quotient controls a
    // convex-hull bound. Hybrid Y has an independent polynomial degree, so it
    // has no single XYZ polygon in this representation and remains course-only.
    const polygons: readonly (readonly C.Vector[])[] =
      curve.type === "cubicBezier"
        ? curve.spans
        : curve.type === "bernstein"
          ? curve.pieces.flatMap((piece: C.Piece): (readonly C.Vector[])[] =>
              piece.primitive === "polynomialBezier"
                ? [piece.controls]
                : piece.primitive === "rationalBezier"
                  ? [
                      piece.homogeneousNumerator.map(
                        (control: C.Vector, i: number): C.Vector =>
                          control.map(
                            (value: number): number =>
                              value / piece.weights[i]!,
                          ) as unknown as C.Vector,
                      ),
                    ]
                  : [],
            )
          : [];
    for (const polygon of polygons) {
      if (
        polygon.some((control: C.Vector): boolean =>
          control.some((value: number): boolean => !Number.isFinite(value)),
        )
      )
        throw new Error(
          "Curve control polygon exceeds the binary64 display range",
        );
      const offset: number = result.cage.positions.length / 3;
      result.cage.positions.push(
        ...polygon.flatMap((v: C.Vector): number[] =>
          v.map((x: number): number => x / 1000),
        ),
      );
      for (let i: number = 0; i < polygon.length - 1; i++)
        result.cage.edges.push(offset + i, offset + i + 1);
    }
  }
  return result;
}
