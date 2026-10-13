import type { IAutoMovieFilmBeautyLayer } from "./IAutoMovieFilmBeautyLayer.js";
import type { AutoMovieFilmBeautyComposition } from "./AutoMovieFilmBeautyComposition.js";

/**
 * Resolve a builder-sampled beauty layer list into one explicit compositor.
 *
 * One fractional layer means color over black, while two complementary layers
 * retain the existing cross-dissolve. Invalid weights and cardinalities are
 * refused by name instead of being clamped or rendered as an opaque shot.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Decides continuous color composition for sampled beauty layers only, leaving structural passes to the dominant-layer rule.
 * @evidence requirements/rendering/frame-schedules-and-sampling.md#rendering-state-sampling Consumes the builder's exact transition weights without a private sampler.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-frame-schedule Distinguishes direct, fade, and dissolve schedules at the projection boundary.
 */
export const resolveAutoMovieFilmBeautyComposition = <
  Layer extends IAutoMovieFilmBeautyLayer,
>(
  layers: readonly Layer[],
): AutoMovieFilmBeautyComposition<Layer> => {
  if (layers.length !== 1 && layers.length !== 2)
    throw new Error(
      `Film beauty composition requires one fade/cut layer or two dissolve layers, but received ${layers.length}.`,
    );
  for (const layer of layers)
    if (
      Number.isFinite(layer.weight) === false ||
      layer.weight < 0 ||
      layer.weight > 1
    )
      throw new Error(
        `Film beauty layer weight ${layer.weight} must be finite and inside [0, 1].`,
      );
  if (layers.length === 1)
    return layers[0]!.weight === 1
      ? { kind: "direct", layer: layers[0]! }
      : { kind: "fade", layer: layers[0]!, weight: layers[0]!.weight };
  const [outgoing, incoming] = layers as readonly [Layer, Layer];
  if (outgoing.weight + incoming.weight !== 1)
    throw new Error(
      `Film dissolve layer weights must sum to one, but received ${outgoing.weight} and ${incoming.weight}.`,
    );
  return { kind: "dissolve", outgoing, incoming, alpha: incoming.weight };
};

