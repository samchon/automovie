import type { IAutoMovieEvaluateSupportSection } from "@automovie/interface";

import { createAutoMovieSupportSectionQuery } from "./createAutoMovieSupportSectionQuery";

/**
 * Intersect oriented unit half-planes in an admitted finite XZ chart. Enumerate
 * boundary pairs and retain intersections satisfying every inequality. Tight
 * constraints, rather than coordinate proximity, identify a common vertex. A
 * relative residual filter delegates uncertain signs to the exact-sign
 * determinant owner. Zero incidence means exact equality for the supplied
 * doubles, independently of observation uncertainty. A weak feasible pair
 * refuses. Callers supply finite dense arrays, unit normals and a bounded
 * section.
 */
export function evaluateAutoMovieSupportSection(
  input: IAutoMovieEvaluateSupportSection.IInput,
): IAutoMovieEvaluateSupportSection.IResult {
  return createAutoMovieSupportSectionQuery(input)(input.offsets);
}
