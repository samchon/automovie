import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";
import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";

/**
 * Admit a named closed cubic section and its complete longitudinal first-variation control field. Section phase widths must sum exactly to one turn; fullJ is measured per longitudinal millimetre.
 *
 * @param boundary Section positions in millimetres and matching mm-per-mm first-variation controls.
 * @throws Error on any missing coefficient, identity, topology or physical-unit mismatch.
 *
 * @evidence contracts/common.md#principled-implementation Primitive admission checks the section, followed by matching span/control layout, finite derivative components, exact ID and declared physical units.
 * @evidence contracts/common.md#clear-and-simple-design Boundary-specific checks extend primitive admission without converting the supplied field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A finite supplied longitudinalAxis is accepted without a unit-length, regularity or section/derivative compatibility proof; callers retain those premises.
 * @evidence contracts/common.md#meaningful-documentation Documents the exact one-turn sum, physical derivative denominator and checks that remain outside admission.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the section and derivative control counts; every represented coefficient must be examined.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No admission result is cached because caller-owned boundary arrays can change between calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The assertion mutates and retains no boundary or coefficient array.
 */
export function assertAutoMovieCurveBoundary64(boundary: C.Boundary): void {
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
  const vector: (v: C.Vector) => void = (v: C.Vector): void => {
    if (!Array.isArray(v) || v.length !== 3)
      throw new Error("Three-dimensional full derivative required");
    for (let i: number = 0; i < 3; i++)
      if (
        !Object.hasOwn(v, i) ||
        typeof v[i] !== "number" ||
        !Number.isFinite(v[i])
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
