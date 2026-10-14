/**
 * A linear-RGB color with optional alpha, the canonical color value for materials, lights, fog, backgrounds and decorative tints.
 *
 * Components are linear (not sRGB-gamma-encoded) numbers in `[0, 1]`, matching how PBR shaders and glTF `baseColorFactor` consume color. `hex` is an optional sRGB label for human and LLM readability and viewer swatches; the engine renders the linear triple and never decodes `hex`.
 *
 * Derive the label, do not type it. `linearColorToSrgbHex` writes `hex` from the triple, `srgbHexToLinearColor` writes the triple from a swatch, and the two round-trip exactly for every eight-bit channel value. Bare `#RRGGBB` fields elsewhere carry the color rather than label one, so they are sRGB inputs: the builder and instance viewer share `srgbHexToLinearColor` for recipe and instance palettes, while the effect viewer applies three.js's equivalent decode to particle colors. A swatch pasted into `r`, `g`, `b` unconverted lands about 2.3 times too bright at midtones: `#808080` becomes linear `0.502` where the swatch means `0.216`.
 *
 * The shared validateColor gate requires a present hex label to match the eight-bit sRGB encoding of the linear RGB triple, ignoring letter case. Alpha does not enter that swatch. A malformed or contradictory label is refused; validation never changes the authoritative numeric channels.
 *
 * Reference: glTF 2.0 `pbrMetallicRoughness.baseColorFactor` (linear), CSS Color Module Level 4.
 *
 * @evidence contracts/common.md#principled-implementation Uses the glTF linear color convention; `linearColorToSrgbHex` and `srgbHexToLinearColor` apply the exact sRGB transfer function (the `0.0031308` and `0.04045` breakpoints, exponent `2.4`), and the material, light, fog and background validators range-check each linear component to `[0, 1]`.
 * @evidence contracts/common.md#clear-and-simple-design A numeric triple plus nullable alpha and label, so an authoring agent adjusts color numerically and the engine range-checks it, while the label stays an optional derived view rather than a second source of truth.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The triple is never re-derived from hex behind the author's back; shared validation refuses labels that differ from the quantized sRGB encoding instead of allowing material, light, fog and background slots to disagree about the same colour representation.
 * @evidence contracts/common.md#meaningful-documentation States linear channel authority and range, conversion helpers and eight-bit round trip, the unconverted-swatch error, nullable alpha, and case-insensitive agreement of an optional label with the quantized RGB swatch.
 * @author Samchon
 */
export interface IAutoMovieColor {
  /** Linear red, `[0, 1]`. */
  r: number;

  /** Linear green, `[0, 1]`. */
  g: number;

  /** Linear blue, `[0, 1]`. */
  b: number;

  /**
   * Linear alpha, `[0, 1]`, where `1` is fully opaque. Null when the color is used in an opacity-irrelevant slot such as a light or emissive color, distinct from `0` (fully transparent).
   */
  a: number | null;

  /**
   * Optional sRGB `#RRGGBB` label for human and LLM readability and viewer swatches, or `null`. Write it with `linearColorToSrgbHex` rather than by hand; validation refuses a label that disagrees with the quantized sRGB encoding of the linear components, ignoring letter case.
   */
  hex: string | null;
}
