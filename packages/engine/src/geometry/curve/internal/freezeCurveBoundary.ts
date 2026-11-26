import type { IAutoMovieCurveBoundary64 } from "@automovie/interface";

/** Copy and freeze the complete admitted cubic boundary without touching the source. */
export function freezeCurveBoundary(
  source: IAutoMovieCurveBoundary64,
): IAutoMovieCurveBoundary64 {
  const copy: IAutoMovieCurveBoundary64 = structuredClone(source);
  for (const span of copy.section.spans) {
    for (const point of span) Object.freeze(point);
    Object.freeze(span);
  }
  for (const span of copy.fullJ) {
    for (const derivative of span) Object.freeze(derivative);
    Object.freeze(span);
  }
  Object.freeze(copy.section.phaseIntervals);
  Object.freeze(copy.section.spans);
  Object.freeze(copy.section);
  Object.freeze(copy.fullJ);
  Object.freeze(copy.longitudinalAxis);
  return Object.freeze(copy);
}
