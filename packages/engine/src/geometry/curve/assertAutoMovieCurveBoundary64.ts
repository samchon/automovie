import type {
  AutoMovieVector3Tuple,
  IAutoMovieCurveBoundary64,
} from "@automovie/interface";

import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";

/**
 * Admit a named closed cubic section and its complete longitudinal
 * first-variation control field. Section phase widths must sum exactly to one
 * turn; fullJ is measured per longitudinal millimetre.
 *
 * @param boundary Section positions in millimetres and matching mm-per-mm
 *   first-variation controls.
 * @throws Error on any missing coefficient, identity, topology or physical-unit
 *   mismatch.
 */
export function assertAutoMovieCurveBoundary64(
  boundary: IAutoMovieCurveBoundary64,
): void {
  if (
    !boundary ||
    typeof boundary.id !== "string" ||
    !boundary.id ||
    boundary.section?.type !== "cubicBezier"
  )
    throw new Error("A named canonical cubic boundary is required");
  assertAutoMovieCurve64(boundary.section);
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
  if (
    !Array.isArray(boundary.fullJ) ||
    boundary.fullJ.length !== boundary.section.spans.length
  )
    throw new Error("Complete physical derivative spans required");
  const vector: (v: Readonly<AutoMovieVector3Tuple>) => void = (
    v: Readonly<AutoMovieVector3Tuple>,
  ): void => {
    if (!Array.isArray(v) || v.length !== 3)
      throw new Error("Three-dimensional full derivative required");
    for (let i: number = 0; i < 3; i++)
      if (
        !Object.hasOwn(v, i) ||
        typeof v[i] !== "number"
      )
        throw new Error("Dense finite derivative vector required");
  };
  for (const span of boundary.fullJ) {
    if (!Array.isArray(span) || span.length !== 4)
      throw new Error("Complete cubic derivative controls required");
    for (const p of span) vector(p);
  }
  vector(boundary.longitudinalAxis);
}
