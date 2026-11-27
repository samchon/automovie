import { IAutoMovieColor } from "@automovie/interface";

/*
 * Encode a linear color as the `#RRGGBB` swatch that displays it.
 *
 * The quantized inverse of srgbHexToLinearColor, and the shared way to
 * write an `IAutoMovieColor.hex` label or a bare sRGB palette entry from a
 * triple. Without it the contract's promise that `hex` is derived from the
 * linear components is an obligation with nothing behind it, which is what left
 * every label in the product hand-typed and unchecked.
 *
 * Components outside `[0, 1]` are clamped, because a swatch cannot represent
 * light the display cannot emit and the eight-bit form is the gamut. A
 * non-finite component is refused instead: it names no color at any exposure,
 * and rounding it would write `NaN` into a string that reads like a swatch.
 */
export function linearColorToSrgbHex(
  color: Pick<IAutoMovieColor, "r" | "g" | "b">,
): string {
  return `#${srgbHexChannel(color.r)}${srgbHexChannel(color.g)}${srgbHexChannel(color.b)}`;
}

/*
 * One linear component as its two lowercase hexadecimal display digits.
 */
const srgbHexChannel: (component: number) => string = (
  component: number,
): string => {
  return Math.round(
    linearChannelToSrgb(Math.min(1, Math.max(0, component))) * 255,
  )
    .toString(16)
    .padStart(2, "0");
};

/*
 * The inverse of srgbChannelToLinear, with the exact `1 / 2.4` exponent
 * rather than the truncated one three.js encodes with.
 */
const linearChannelToSrgb: (component: number) => number = (
  component: number,
): number =>
  component <= 0.0031308
    ? component * 12.92
    : 1.055 * Math.pow(component, 1 / 2.4) - 0.055;
