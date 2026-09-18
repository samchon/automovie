import { ViolationCollector } from "./ViolationCollector";
import { IAutoMovieColor } from "@automovie/interface";

/**
 * Reports normalized colour-range and optional hexadecimal-label violations on model materials.
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation Checks bounded RGB/optional alpha and the independent optional hexadecimal colour label.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-surface-visual Checks bounded RGB/optional alpha and the independent optional hexadecimal colour label.
 */
export const validateColor = (
  color: IAutoMovieColor,
  path: string,
  collector: ViolationCollector,
): void => {
  for (const ch of ["r", "g", "b"] as const)
    collector.range(`${path}.${ch}`, color[ch], 0, 1, ch);
  if (color.a !== null) collector.range(`${path}.a`, color.a, 0, 1, "a");
  if (color.hex !== null && !HEX_COLOR_PATTERN.test(color.hex))
    collector.push(
      "type",
      `${path}.hex`,
      `hex must be null or a #RRGGBB color label, but was "${color.hex}"`,
      color.hex,
    );
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
