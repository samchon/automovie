import { AutoMoviePrimitiveShape, IAutoMovieModelPart, IAutoMovieTransform } from "@automovie/interface";

/**
 * Wrap the supplied primitive shape and optional transform as one generated part with no material or bone binding. Shape/transform references are borrowed unchanged and admitted by the actual engine consumer.
 */
export function primitivePart(
  id: string,
  shape: AutoMoviePrimitiveShape,
  transform: IAutoMovieTransform | null = null
): IAutoMovieModelPart {
  return ({
  id,
  name: null,
  geometry: { type: "primitive", shape },
  material: null,
  attachedBone: null,
  transform,
});
}
