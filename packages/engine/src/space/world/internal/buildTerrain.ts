import type {
  IAutoMovieWorldSurface,
  IAutoMovieWorldTerrain,
} from "@automovie/interface";

/*
 * Construct a flat world surface from an authored XZ footprint and height.
 */
export function buildTerrain(
  input: IAutoMovieWorldTerrain.IInput,
): IAutoMovieWorldSurface {
  return {
    id: input.id,
    polygon: structuredClone(input.polygon),
    height: { kind: "constant", value: input.height },
    walkable: input.walkable,
  };
}
