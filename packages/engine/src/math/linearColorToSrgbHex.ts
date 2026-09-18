import type { IAutoMovieColor } from "@automovie/interface";

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
 * @evidence requirements/lighting/color-exposure-and-display-boundary.md#lighting-working-color-space Derives the display-encoded label from the scene-linear value instead of letting the two be typed independently.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-color-effective-ownership Implements the display-encoding stage of the ordered color pipeline as the recorded inverse of the input decode.
 * @author Samchon
 */
export const linearColorToSrgbHex = (
  color: Pick<IAutoMovieColor, "r" | "g" | "b">,
): string =>
  `#${srgbHexChannel(color.r)}${srgbHexChannel(color.g)}${srgbHexChannel(color.b)}`;

/**
 * One linear component as its two lowercase hexadecimal display digits.
 */
const srgbHexChannel = (component: number): string => {
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
const linearChannelToSrgb = (component: number): number =>
  component <= 0.0031308
    ? component * 12.92
    : 1.055 * Math.pow(component, 1 / 2.4) - 0.055;
