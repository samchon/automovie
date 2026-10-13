import { IAutoMovieWorldSurface } from "@automovie/interface";

/** Build one flat terrain primitive from an explicit world-XZ footprint. */
export const worldTerrain = (input: {
  id: string;
  polygon: IAutoMovieWorldSurface["polygon"];
  height: number;
  walkable: boolean;
}): IAutoMovieWorldSurface => ({
  id: input.id,
  polygon: structuredClone(input.polygon),
  height: { kind: "constant", value: input.height },
  walkable: input.walkable,
});
