import { ViolationCollector } from "./ViolationCollector";
import { finiteMinimum } from "./finiteMinimum";

/** The most overlays one material may carry: each samples up to two images. */
const MAXIMUM_OVERLAYS = 4;

/**
 * Reports a material's malformed overlay list at the caller's exact path: a
 * list that is not one or holds more than four, an entry that is not a
 * record, a missing colour image, an unknown blend, and a roughness,
 * strength or normal scale out of range. The images themselves are checked
 * with the material's other bindings.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation Admits a material's surface overlays by their count, colour image, blend and ranged factors.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-surface-visual Admits a material's surface overlays by their count, colour image, blend and ranged factors.
 */
export const validateMaterialOverlays = (
  overlays: unknown,
  path: string,
  collector: ViolationCollector,
): void => {
  if (overlays === undefined) return;
  if (!Array.isArray(overlays)) {
    collector.push("type", path, "overlays must be a list", overlays);
    return;
  }
  if (overlays.length > MAXIMUM_OVERLAYS)
    collector.push(
      "range",
      path,
      `a material carries at most ${MAXIMUM_OVERLAYS} overlays, but has ${overlays.length}`,
      overlays.length,
    );
  overlays.forEach((entry: unknown, index) => {
    const at = `${path}[${index}]`;
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      collector.push("type", at, "an overlay must be a record", entry);
      return;
    }
    const overlay = entry as Record<string, unknown>;
    if (
      overlay.baseColorTexture === undefined ||
      overlay.baseColorTexture === null
    )
      collector.push(
        "type",
        `${at}.baseColorTexture`,
        "an overlay needs its colour image, whose alpha is its coverage",
        overlay.baseColorTexture,
      );
    if (overlay.blend !== "multiply" && overlay.blend !== "replace")
      collector.push(
        "type",
        `${at}.blend`,
        'overlay blend must be "multiply" or "replace"',
        overlay.blend,
      );
    collector.range(
      `${at}.strength`,
      overlay.strength as number,
      0,
      1,
      "overlay strength",
    );
    if (overlay.roughness !== undefined)
      collector.range(
        `${at}.roughness`,
        overlay.roughness as number,
        0,
        1,
        "overlay roughness",
      );
    if (overlay.colorFactor !== undefined)
      for (const channel of ["r", "g", "b"] as const)
        finiteMinimum(
          (overlay.colorFactor as Record<string, number>)[channel],
          0,
          `${at}.colorFactor.${channel}`,
          "overlay colour factor",
          collector,
        );
    if (overlay.normalScale !== undefined)
      finiteMinimum(
        overlay.normalScale as number,
        0,
        `${at}.normalScale`,
        "overlay normal scale",
        collector,
      );
  });
};
