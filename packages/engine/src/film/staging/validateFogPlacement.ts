import type { IAutoMovieViolationCollector } from "@automovie/interface";

import { describeInvalidValue } from "../../validation/describeInvalidValue";
import { isRecord } from "../../validation/isRecord";
import { validateColor } from "../../validation/validateColor";

/**
 * Validate the staged atmosphere, the only check a fog gets before `stageScene` lowers it verbatim into the scene and the renderer's fog law reads it.
 *
 * {@link IAutoMovieFog} carries two facts and both are checked: an extinction density, per metre, that must be a finite number of at least zero, since a negative one has no extinction meaning and a non-finite one cannot be sampled; and a canonical linear color with nullable alpha and a matching optional sRGB label, checked by validateColor. Density has no upper bound: a dense fog is a look, not a mistake. The value is read as `unknown`, because `stage` is reachable in-process without the transport's structural gate, so a `null` fog becomes a located violation rather than a later `TypeError`. Violations go to `out` at `<path>`, `<path>.density`, `<path>.color` and `<path>.color.<channel>`.
 *
 * Ordinary JSON objects that shadow string-conversion methods still produce located density or color findings; failed conversion uses `an uninspectable value` in the message while retaining the authored value. Throwing property accessors and nonterminating conversion hooks are outside this admission guarantee.
 *
 * @param fog The authored fog, unchecked.
 * @param path Violation path of the fog.
 * @param out Collector the violations are appended to.
 */
export function validateFogPlacement(
  fog: unknown,
  path: string,
  out: IAutoMovieViolationCollector,
): void {
  if (!isRecord(fog)) {
    out.push("type", path, "fog must be a JSON object", fog);
    return;
  }
  const density: unknown = fog.density;
  if (typeof density !== "number" || !Number.isFinite(density) || density < 0)
    out.push(
      "range",
      `${path}.density`,
      `fog density must be a finite number >= 0, but was ${describeInvalidValue(density)}`,
      density,
    );
  validateColor(fog.color, `${path}.color`, out);
}
