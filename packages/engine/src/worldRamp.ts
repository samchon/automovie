import { IAutoMovieWorldSurface } from "@automovie/interface";

/**
 * Build one rectangular ramp surface from a centerline and explicit rise.
 *
 * @evidence requirements/map/terrain-and-landforms.md#map-elevation-slope Derives the ramp's footprint and planar slope from its authored centerline, width, base elevation, and rise.
 * @evidence specifications/world-and-site/terrain-ground-and-geology.md#world-site-elevation-slope-surface-input Produces one explicit plane-height rule after rejecting degenerate or non-finite surface inputs.
 */
export const worldRamp = (input: {
  id: string;
  from: { x: number; z: number };
  to: { x: number; z: number };
  width: number;
  baseHeight: number;
  rise: number;
  walkable: boolean;
}): IAutoMovieWorldSurface => {
  assertText(input.id, "World ramp id");
  const dx = input.to.x - input.from.x;
  const dz = input.to.z - input.from.z;
  const lengthSquared = dx * dx + dz * dz;
  if (
    Number.isFinite(input.width) === false ||
    input.width <= 0 ||
    Number.isFinite(input.baseHeight) === false ||
    Number.isFinite(input.rise) === false ||
    Number.isFinite(lengthSquared) === false ||
    lengthSquared <= 0
  )
    throw new Error(
      `World ramp "${input.id}" requires finite distinct endpoints, positive width, and finite baseHeight/rise.`,
    );
  const length = Math.sqrt(lengthSquared);
  const offset = {
    x: (-dz / length) * (input.width / 2),
    z: (dx / length) * (input.width / 2),
  };
  return {
    id: input.id,
    polygon: [
      { x: input.from.x + offset.x, z: input.from.z + offset.z },
      { x: input.to.x + offset.x, z: input.to.z + offset.z },
      { x: input.to.x - offset.x, z: input.to.z - offset.z },
      { x: input.from.x - offset.x, z: input.from.z - offset.z },
    ],
    height: {
      kind: "plane",
      originHeight:
        input.baseHeight -
        (input.rise * (dx * input.from.x + dz * input.from.z)) / lengthSquared,
      slopeX: (input.rise * dx) / lengthSquared,
      slopeZ: (input.rise * dz) / lengthSquared,
    },
    walkable: input.walkable,
  };
};
