import { IAutoMovieColor } from "@automovie/interface";

/**
 * Encode a linear color as the `#RRGGBB` swatch that displays it.
 *
 * The quantized inverse of {@link srgbHexToLinearColor}, and the shared way to
 * write an `IAutoMovieColor.hex` label or a bare sRGB palette entry from a
 * triple. Without it the contract's promise that `hex` is derived from the
 * linear components is an obligation with nothing behind it, which is what left
 * every label in the product hand-typed and unchecked.
 *
 * Components outside `[0, 1]` are clamped, because a swatch cannot represent
 * light the display cannot emit and the eight-bit form is the gamut. A
 * non-finite component is refused instead: it names no color at any exposure,
 * and rounding it would write `NaN` into a string that reads like a swatch.
 *
 * @evidence contracts/common.md#principled-implementation The sRGB linear toe and exact one-over-2.4 power precede eight-bit rounding; finite out-of-gamut channels project to the displayable interval.
 * @evidence contracts/common.md#clear-and-simple-design One encoder derives swatches from linear RGB beside the inverse decoder instead of independently authored palette labels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite channels refuse rather than writing hexadecimal NaN, while gamut clipping follows the documented display contract.
 * @evidence contracts/common.md#meaningful-documentation States linear input, lowercase RRGGBB output, quantized inverse relation, clipping and nonfinite refusal.
 * @evidence contracts/performance.md#efficient-algorithms Three transfer evaluations and fixed-width conversions take constant work for a seven-character swatch.
 * @evidence contracts/performance.md#reuse-equivalent-work Each current color channel is encoded once; mutable color records have no shared label cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three temporary channel strings form the returned swatch, and the input color is not retained.
 * @author Samchon
 */
export const linearColorToSrgbHex: (
  color: Pick<IAutoMovieColor, "r" | "g" | "b">,
) => string = (color: Pick<IAutoMovieColor, "r" | "g" | "b">): string =>
  `#${srgbHexChannel(color.r)}${srgbHexChannel(color.g)}${srgbHexChannel(color.b)}`;

/**
 * One linear component as its two lowercase hexadecimal display digits.
 */
const srgbHexChannel: (component: number) => string = (
  component: number,
): string => {
  if (Number.isFinite(component) === false)
    throw new Error(
      `Linear color component ${component} is not a finite number.`,
    );
  return Math.round(
    linearChannelToSrgb(Math.min(1, Math.max(0, component))) * 255,
  )
    .toString(16)
    .padStart(2, "0");
};

/**
 * The inverse of {@link srgbChannelToLinear}, with the exact `1 / 2.4`
 * exponent rather than the truncated one three.js encodes with.
 */
const linearChannelToSrgb: (component: number) => number = (
  component: number,
): number =>
  component <= 0.0031308
    ? component * 12.92
    : 1.055 * Math.pow(component, 1 / 2.4) - 0.055;
