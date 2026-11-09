/**
 * Colour model observed from the decoded PNG's IHDR colour type. This describes stored channels, independently of colour space and bit depth.
 *
 * @evidence contracts/development/design.md#principled-representation The five literals match PNG colour types for grayscale, grayscale with alpha, truecolour, truecolour with alpha and palette indexing; probeProductionPngPicture reads the admitted IHDR rather than guessing from decoded RGBA pixels.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Stored channel layout is one closed field beside the separate alpha, colour-space and bit-depth observations, so palette images are not mislabeled as RGBA after decoder expansion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Filename extensions and requested capture settings do not establish channel layout; the probe reports the actual PNG header's supported colour model.
 * @evidence contracts/development/common.md#meaningful-documentation States that this is a header-observed channel model and distinguishes it from decoding colour space and component precision.
 */
export type AutoMovieProductionPngColor =
  | "gray"
  | "gray-alpha"
  | "rgb"
  | "rgba"
  | "palette";
