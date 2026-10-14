import { IAutoMovieWorldEffectZone } from "@automovie/interface";

/** Return the existing yard-sized bounds with the supplied id and unchanged recipe/seed defaults. Bounds are fresh, and reference resolution belongs to materialization tests rather than this factory. */
export const filmEffectZone: (
  id: string,
  recipe?: string,
  seed?: number,
) => IAutoMovieWorldEffectZone = (
  id: string,
  recipe: string = "fog-recipe",
  seed: number = 3,
): IAutoMovieWorldEffectZone => ({
  id,
  recipe,
  bounds: { min: { x: -1, y: 0, z: -1 }, max: { x: 1, y: 1, z: 1 } },
  seed,
});
