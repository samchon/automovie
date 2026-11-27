import type {
  IAutoMovieFog,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { describeInvalidValue } from "../../../validation/describeInvalidValue";
import { validateColor } from "../../../validation/internal/validateColor";

/**
 * Validate the staged atmosphere, the only check a fog gets before `stageScene`
 * lowers it verbatim into the scene and the renderer's fog law reads it.
 *
 * {@link IAutoMovieFog} carries two facts and both are checked: an extinction
 * density, per metre, that must be at least zero, since a negative one has no
 * extinction meaning; and a canonical linear color with nullable alpha and a matching
 * optional sRGB label, checked by validateColor. Density has no upper bound: a
 * dense fog is a look, not a mistake. Violations go to `out` at
 * `<path>.density`, `<path>.color` and `<path>.color.<channel>`.
 *
 * @param fog The authored fog.
 * @param path Violation path of the fog.
 * @param out Collector the violations are appended to.
 */
export function validateFogPlacement(
  fog: IAutoMovieFog,
  path: string,
  out: IAutoMovieViolationCollector,
): void {
  if (fog.density < 0)
    out.push(
      "range",
      `${path}.density`,
      `fog density must be >= 0, but was ${describeInvalidValue(fog.density)}`,
      fog.density,
    );
  validateColor(fog.color, `${path}.color`, out);
}
