import {
  IAutoMovieWorldSurface,
  type IAutoMovieWorldTerrain,
} from "@automovie/interface";

/** Construct a flat world surface from an authored XZ footprint and height. */
export const worldTerrain: (
  input: IAutoMovieWorldTerrain.IInput,
) => IAutoMovieWorldSurface = (
  input: IAutoMovieWorldTerrain.IInput,
): IAutoMovieWorldSurface => ({
  id: input.id,
  polygon: structuredClone(input.polygon),
  height: { kind: "constant", value: input.height },
  walkable: input.walkable,
});
