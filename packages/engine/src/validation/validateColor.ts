import { linearColorToSrgbHex } from "../math/linearColorToSrgbHex";
import { ViolationCollector } from "./ViolationCollector";
import { isRecord } from "./isRecord";

/** The optional display label uses exactly three eight-bit sRGB channels. */
const HEX_COLOR_PATTERN: RegExp = /^#[0-9A-Fa-f]{6}$/;

/**
 * Append every malformed linear RGBA field and contradictory display label. RGB and non-null alpha must be finite within [0,1]. Hex is null or #RRGGBB and, when present, must equal the quantized sRGB encoding of the linear RGB values, ignoring letter case. Alpha does not enter that display swatch.
 *
 * The check is total over ordinary unknown JSON payloads. It reports a bad object at path and individual fields below it, without mutating or decoding the label into the authoritative numeric channels. A malformed RGB triple skips only the dependent label-consistency check.
 *
 * @param color The unchecked color record.
 * @param path Prefix used for every field finding.
 * @param collector Caller-owned sink receiving findings in RGB, alpha, hex order.
 *
 * @evidence contracts/common.md#principled-implementation Validates the canonical linear color representation and derives the optional display label through linearColorToSrgbHex's sRGB transfer and eight-bit rounding; only admitted RGB channels enter that conversion, alpha stays independent and case changes preserve the same hexadecimal swatch.
 * @evidence contracts/common.md#clear-and-simple-design Owns one unknown-input color gate used by materials, staged atmosphere and lights, scene backgrounds and production artifacts, so object shape, scalar bounds and label consistency cannot acquire different rules in those consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports authored values without clamping or replacing channels from hex; every supported color slot applies the same optional-label rule, and invalid RGB does not provoke a secondary conversion exception.
 * @evidence contracts/common.md#meaningful-documentation Gives linear channel ranges, nullable alpha and hex semantics, the quantized sRGB agreement rule, case-insensitive labels, alpha independence, error paths and the dependent-check skip on malformed RGB.
 * @evidence contracts/performance.md#efficient-algorithms Checks a fixed five-field record with three range checks and at most one three-channel sRGB encoding, constant time and space independent of scene or material population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validates the caller's current mutable color once; there is no identity or content revision for safely caching verdicts across later authoring edits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains no color or conversion result after return; the caller's collector owns at most one object-shape finding or one per invalid scalar/label field.
 */
export function validateColor(
  color: unknown,
  path: string,
  collector: ViolationCollector,
): void {
  if (!isRecord(color)) {
    collector.push("type", path, "color must be a JSON object", color);
    return;
  }
  const beforeRgb: number = collector.items.length;
  for (const channel of ["r", "g", "b"] as const)
    collector.range(`${path}.${channel}`, color[channel], 0, 1, channel);
  const validRgb: boolean = collector.items.length === beforeRgb;
  if (color.a !== null) collector.range(`${path}.a`, color.a, 0, 1, "a");
  if (color.hex === null) return;
  if (typeof color.hex !== "string" || !HEX_COLOR_PATTERN.test(color.hex)) {
    collector.push(
      "type",
      `${path}.hex`,
      "hex must be null or a #RRGGBB color label",
      color.hex,
    );
    return;
  }
  if (
    validRgb &&
    typeof color.r === "number" &&
    typeof color.g === "number" &&
    typeof color.b === "number"
  ) {
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
