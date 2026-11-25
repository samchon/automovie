import type {
  IAutoMovieColor,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { linearColorToSrgbHex } from "../math/linearColorToSrgbHex";

/** The optional display label uses exactly three eight-bit sRGB channels. */
const HEX_COLOR_PATTERN: RegExp = /^#[0-9A-Fa-f]{6}$/;

/**
 * Append every out-of-range linear RGBA field and contradictory display label.
 * RGB and non-null alpha must be finite within [0,1]. Hex is null or #RRGGBB
 * and, when present, must equal the quantized sRGB encoding of the linear RGB
 * values, ignoring letter case. Alpha does not enter that display swatch.
 *
 * It reports individual fields below `path`, without mutating or decoding the
 * label into the authoritative numeric channels. An out-of-range RGB triple
 * skips only the dependent label-consistency check.
 *
 * @param color The color record.
 * @param path Prefix used for every field finding.
 * @param collector Caller-owned sink receiving findings in RGB, alpha, hex
 *   order.
 */
export function validateColor(
  color: IAutoMovieColor,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  const beforeRgb: number = collector.items.length;
  for (const channel of ["r", "g", "b"] as const)
    collector.range(`${path}.${channel}`, color[channel], 0, 1, channel);
  const validRgb: boolean = collector.items.length === beforeRgb;
  if (color.a !== null) collector.range(`${path}.a`, color.a, 0, 1, "a");
  if (color.hex === null) return;
  if (!HEX_COLOR_PATTERN.test(color.hex)) {
    collector.push(
      "type",
      `${path}.hex`,
      "hex must be null or a #RRGGBB color label",
      color.hex,
    );
    return;
  }
  if (validRgb) {
    const expected: string = linearColorToSrgbHex({
      r: color.r,
      g: color.g,
      b: color.b,
    });
    if (color.hex.toLowerCase() !== expected)
      collector.push(
        "type",
        `${path}.hex`,
        `hex must match the linear RGB channels encoded as ${expected}, but was "${color.hex}"`,
        color.hex,
      );
  }
}
