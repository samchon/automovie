import type {
  IAutoMovieCurveBoundary64,
} from "@automovie/interface";

import { assertCurve64 } from "./assertCurve64";
import { assertFiniteCurveVector } from "./assertFiniteCurveVector";

/*
 * Admit a named closed cubic section and its complete longitudinal
 * first-variation control field. Section phase widths must sum exactly to one
 * turn; fullJ is measured per longitudinal millimetre.
 * Parameter boundary: Section positions in millimetres and matching mm-per-mm
 * first-variation controls.
 * Error on any missing coefficient, identity, topology or physical-unit
 * mismatch.
 */
export function assertCurveBoundary64(
  boundary: IAutoMovieCurveBoundary64,
): void {
  if (!boundary.id.trim() || boundary.section.type !== "cubicBezier")
    throw new Error("A named canonical cubic boundary is required");
  assertCurve64(boundary.section);
  if (
    boundary.section.name !== boundary.id ||
    !boundary.section.closed ||
    boundary.section.phaseUnit !== "turn" ||
    boundary.section.phaseIntervals.reduce(
      (s: number, w: number): number => s + w,
      0,
    ) !== 1 ||
    boundary.longitudinalUnit !== "mm"
  )
    throw new Error("Invalid full physical boundary units or identity");
  if (boundary.fullJ.length !== boundary.section.spans.length)
    throw new Error("Complete physical derivative spans required");
  assertFiniteCurveVector(boundary.longitudinalAxis);
  for (let i: number = 0; i < boundary.fullJ.length; i++)
    if (!Object.hasOwn(boundary.fullJ, i))
      throw new Error("Complete physical derivative spans required");
  for (const span of boundary.fullJ) {
    if (span.length !== 4 || [0, 1, 2, 3].some((i: number): boolean => !Object.hasOwn(span, i)))
      throw new Error("Complete physical derivative spans required");
    for (const point of span) assertFiniteCurveVector(point);
  }
}
