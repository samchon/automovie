import type { AutoMovieFilmBeautyComposition } from "./AutoMovieFilmBeautyComposition.js";
import type { IAutoMovieFilmBeautyLayer } from "./IAutoMovieFilmBeautyLayer.js";

/**
 * Resolve a builder-sampled beauty layer list into one explicit compositor.
 *
 * One fractional layer means color over black, while two complementary layers retain the existing cross-dissolve. Invalid weights and cardinalities are refused by name instead of being clamped or rendered as an opaque shot.
 *
 * @evidence contracts/common.md#principled-implementation Admits exactly one/two finite0..1 sampled layers, interpreting full single weight as direct, fractional single as fade and exact-complement pair as ordered dissolve.
 * @evidence contracts/common.md#clear-and-simple-design One explicit discriminated composition separates admission from frame dispatch and native display effects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid cardinality/weight/exact complement refuses rather than clamp, normalize or invent an opaque shot; floating inputs must already carry the canonical sampler complement relation.
 * @evidence contracts/common.md#meaningful-documentation Documents direct/fade/dissolve operands and named invalid weight/cardinality semantics before rendering.
 * @evidence contracts/performance.md#efficient-algorithms At most two admitted layers require fixed checks and one small composition wrapper; no payload clone, sort or scene traversal is performed.
 * @evidence contracts/performance.md#reuse-equivalent-work Returned branches borrow actual layer identity for their one draw; different sampled frame inputs are not memoized by equal weight or shot name.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the small result wrapper holds borrowed layers, with no renderer, target, texture or persistent composition cache acquired.
 */
export const resolveAutoMovieFilmBeautyComposition: <
  Layer extends IAutoMovieFilmBeautyLayer,
>(
  layers: readonly Layer[],
) => AutoMovieFilmBeautyComposition<Layer> = <
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
  const [outgoing, incoming]: readonly [Layer, Layer] = layers as readonly [
    Layer,
    Layer,
  ];
  if (outgoing.weight + incoming.weight !== 1)
    throw new Error(
      `Film dissolve layer weights must sum to one, but received ${outgoing.weight} and ${incoming.weight}.`,
    );
  return { kind: "dissolve", outgoing, incoming, alpha: incoming.weight };
};
