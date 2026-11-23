import type { IAutoMovieViolationCollector } from "@automovie/interface";

import { finiteMinimum } from "./finiteMinimum";
import { isRecord } from "./isRecord";

/** The most overlays one material may carry: each samples up to two images. */
const MAXIMUM_OVERLAYS: number = 4;

/**
 * Admit optional overlay lists, record entries, required color image, blend,
 * strength and optional numeric factors.
 */
export const validateMaterialOverlays: (
  overlays: unknown,
  path: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  overlays: unknown,
  path: string,
  collector: IAutoMovieViolationCollector,
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
  for (let index: number = 0; index < overlays.length; ++index) {
    const entry: unknown = overlays[index];
    const at: string = `${path}[${index}]`;
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      collector.push("type", at, "an overlay must be a record", entry);
      continue;
    }
    const overlay: Record<string, unknown> = entry as Record<string, unknown>;
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
    if (overlay.colorFactor !== undefined) {
      if (!isRecord(overlay.colorFactor))
        collector.push(
          "type",
          `${at}.colorFactor`,
          "overlay colour factor must be a record",
          overlay.colorFactor,
        );
      else
        for (const channel of ["r", "g", "b"] as const)
          finiteMinimum(
            overlay.colorFactor[channel] as number,
            0,
            `${at}.colorFactor.${channel}`,
            "overlay colour factor",
            collector,
          );
    }
    if (overlay.normalScale !== undefined)
      finiteMinimum(
        overlay.normalScale as number,
        0,
        `${at}.normalScale`,
        "overlay normal scale",
        collector,
      );
  }
};
