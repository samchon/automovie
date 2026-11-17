/**
 * The minimum film-layer shape needed to decide beauty composition.
 *
 * @evidence contracts/development/design.md#principled-representation One scalar contribution lets the generic beauty resolver classify direct, fade and complementary dissolve decisions while preserving richer sampled-layer records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Composition admission depends only on weight, so this minimal interface avoids coupling the resolver to scenes, cameras or shot identifiers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Weights represent sampled display contributions for arbitrary film layers and carry no fixture-specific transition names.
 * @evidence contracts/development/common.md#meaningful-documentation The member documents the unit interval and application to source display bytes rather than linear scene radiance.
 */
export interface IAutoMovieFilmBeautyLayer {
  /** Sampled contribution in `[0, 1]`, applied to source display bytes. */
  weight: number;
}
