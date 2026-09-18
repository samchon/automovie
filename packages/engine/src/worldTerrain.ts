import { IAutoMovieWorldSurface } from "@automovie/interface";

/**
 * Build one flat terrain primitive from an explicit world-XZ footprint.
 *
 * @evidence requirements/map/terrain-and-landforms.md#map-elevation-slope Preserves an authored XZ footprint, constant elevation, and traversal state as one terrain surface.
 * @evidence requirements/map/movement-and-visibility.md#map-traversable-surfaces `worldTerrain` preserves the caller's explicit walkable state on the same stable terrain identity and footprint used by world queries.
 * @evidence specifications/world-and-site/terrain-ground-and-geology.md#world-site-elevation-slope-surface-input Emits a constant-height surface whose footprint and elevation remain explicit deterministic inputs.
 * @evidence specifications/world-and-site/traversal-and-visibility.md#world-site-traversable-surface-input The emitted surface carries its exact world footprint, height, and traversability flag without inferring a route or cost model.
 */
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
