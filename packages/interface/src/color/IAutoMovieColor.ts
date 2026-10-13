/**
 * A linear-RGB color with optional alpha, the canonical color value for
 * materials, lights, fog, backgrounds and decorative tints.
 *
 * Components are linear (not sRGB-gamma-encoded) numbers in `[0, 1]`, matching
 * how PBR shaders and glTF `baseColorFactor` consume color. `hex` is an
 * optional sRGB label for human and LLM readability and viewer swatches; the
 * engine renders the linear triple and never decodes `hex`.
 *
 * Derive the label, do not type it. `linearColorToSrgbHex` writes `hex` from
 * the triple, `srgbHexToLinearColor` writes the triple from a swatch, and the
 * two round-trip exactly for every eight-bit channel value. Bare `#RRGGBB`
 * fields elsewhere carry the color rather than label one, so they are sRGB
 * inputs: the builder and instance viewer share `srgbHexToLinearColor` for
 * recipe and instance palettes, while the effect viewer applies three.js's
 * equivalent decode to particle colors. A swatch pasted into `r`, `g`, `b`
 * unconverted lands about 2.3 times too bright at midtones: `#808080` becomes
 * linear `0.502` where the swatch means `0.216`.
 *
 * Nothing compares `hex` against `r`, `g`, `b`. Model materials and scene
 * backgrounds check only the `#RRGGBB` form, and light and fog colors do not
 * check `hex` at all, so a hand-typed label can contradict the numbers it sits
 * beside and the engine renders the numbers without saying so.
 *
 * Reference: glTF 2.0 `pbrMetallicRoughness.baseColorFactor` (linear), CSS
 * Color Module Level 4.
 *
 * @evidence contracts/common.md#principled-implementation Uses the glTF linear color convention; `linearColorToSrgbHex` and `srgbHexToLinearColor` apply the exact sRGB transfer function (the `0.0031308` and `0.04045` breakpoints, exponent `2.4`), and the material, light, fog and background validators range-check each linear component to `[0, 1]`.
 * @evidence contracts/common.md#clear-and-simple-design A numeric triple plus nullable alpha and label, so an authoring agent adjusts color numerically and the engine range-checks it, while the label stays an optional derived view rather than a second source of truth.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The triple is never re-derived from `hex` behind the author's back; the remaining gap is that no validator refuses a label that disagrees with the triple, and light and fog colors leave the label's form unchecked, both stated in the documentation.
 * @evidence contracts/common.md#meaningful-documentation States the color space and range, which field is authoritative, the conversion helpers and their exact round trip, the size of the unconverted-swatch error, what null alpha means, and which validators check the label and which do not.
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
   * Linear alpha, `[0, 1]`, where `1` is fully opaque. Null when the color is
   * used in an opacity-irrelevant slot such as a light or emissive color,
   * distinct from `0` (fully transparent).
   */
  a: number | null;

  /**
   * Optional sRGB `#RRGGBB` label for human and LLM readability and viewer
   * swatches, or `null`. Write it with `linearColorToSrgbHex` rather than by
   * hand; the linear components are authoritative, and nothing refuses a label
   * that disagrees with them.
   */
  hex: string | null;
}
