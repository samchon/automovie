import { ViolationCollector } from "../../validation/ViolationCollector";
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
 *
 * @evidence contracts/common.md#principled-implementation Checks the extinction density and color the fog law in sceneFogTransmittance and the renderer read, narrowing unknown density before comparison and delegating color shape and channel admission to validateColor. This is the engine staging gate; Production validateSceneArtifact independently checks admitted scene fog again at its artifact boundary.
 * @evidence contracts/common.md#clear-and-simple-design Owns the fog extinction-density rule and delegates the full color record to validateColor, the same unknown-input gate materials, lights and backgrounds use for channel ranges and derived-label consistency.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No density ceiling is imposed and nothing is clamped or defaulted; a refused value is reported as authored.
 * @evidence contracts/common.md#meaningful-documentation States units, bounds, the absent ceiling, unknown ingress, reported paths and conversion-failure handling, with hostile-accessor and nonterminating-hook limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The density and five-field color gates do fixed scalar work without searching scene objects; refused-value conversion and output text add their own cost, with no bound on user-defined conversion hooks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Checks one staged fog per call and coordinates no work across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing itself; the caller's collector owns at most one density finding and five color-field findings, or the corresponding object-shape refusals.
 */
export function validateFogPlacement (
  fog: unknown,
  path: string,
  out: ViolationCollector,
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
