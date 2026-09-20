/**
 * Decoded PNG color model.
 *
 * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-alpha-channels Distinguishes the exact decoded channel population.
 * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Defines the closed picture-model vocabulary used by profile comparison.
 */
export type AutoMovieProductionPngColor =
  | "gray"
  | "gray-alpha"
  | "rgb"
  | "rgba"
  | "palette";
