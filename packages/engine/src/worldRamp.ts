import {
  type IAutoMovieWorldRamp,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

/** Construct a rectangular planar ramp from a centerline, width and rise. */
export const worldRamp: (
  input: IAutoMovieWorldRamp.IInput,
) => IAutoMovieWorldSurface = (
  input: IAutoMovieWorldRamp.IInput,
): IAutoMovieWorldSurface => {
  const dx: number = input.to.x - input.from.x;
  const dz: number = input.to.z - input.from.z;
  const lengthSquared: number = dx * dx + dz * dz;
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
  const length: number = Math.sqrt(lengthSquared);
  const offset: { x: number; z: number } = {
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
