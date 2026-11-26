import type {
  IAutoMovieWorldRamp,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

/** Construct a rectangular planar ramp from a centerline, width and rise. */
export function buildRamp(
  input: IAutoMovieWorldRamp.IInput,
): IAutoMovieWorldSurface {
  const dx: number = input.to.x - input.from.x;
  const dz: number = input.to.z - input.from.z;
  const length: number = Math.hypot(dx, dz);
  const halfWidth: number = input.width / 2;
  if (
    !(
      input.id.trim().length > 0 &&
      length > 0 &&
      length < Infinity &&
      halfWidth > 0 &&
      halfWidth < Infinity
    )
  )
    throw new Error(
      `World ramp "${input.id}" requires finite distinct endpoints, positive width, and finite baseHeight/rise.`,
    );

  // Unit directions keep the width and slope independent of a squared span
  // that can overflow or underflow despite representable geometry.
  const ux: number = dx / length;
  const uz: number = dz / length;
  const ox: number = -uz * halfWidth;
  const oz: number = ux * halfWidth;
  const fromLeft: IAutoMovieWorldRamp.IInput["from"] = {
    x: input.from.x + ox,
    z: input.from.z + oz,
  };
  const toLeft: IAutoMovieWorldRamp.IInput["to"] = {
    x: input.to.x + ox,
    z: input.to.z + oz,
  };
  const toRight: IAutoMovieWorldRamp.IInput["to"] = {
    x: input.to.x - ox,
    z: input.to.z - oz,
  };
  const fromRight: IAutoMovieWorldRamp.IInput["from"] = {
    x: input.from.x - ox,
    z: input.from.z - oz,
  };

  const fromWidth: number =
    (fromRight.x - fromLeft.x) * uz + (fromLeft.z - fromRight.z) * ux;
  const toWidth: number =
    (toRight.x - toLeft.x) * uz + (toLeft.z - toRight.z) * ux;
  const grade: number = input.rise / length;
  const slopeX: number = grade * ux;
  const slopeZ: number = grade * uz;
  const originHeight: number =
    input.baseHeight - (slopeX * input.from.x + slopeZ * input.from.z);
  if (
    !(
      fromWidth > 0 &&
      fromWidth < Infinity &&
      toWidth > 0 &&
      toWidth < Infinity &&
      (grade !== 0 || input.rise === 0) &&
      Math.abs(originHeight) < Infinity &&
      Math.abs(input.baseHeight + input.rise) < Infinity
    )
  )
    throw new Error(
      `World ramp "${input.id}" requires representable footprint widths and plane heights.`,
    );

  return {
    id: input.id,
    polygon: [fromLeft, toLeft, toRight, fromRight],
    height: {
      kind: "plane",
      originHeight,
      slopeX,
      slopeZ,
    },
    walkable: input.walkable,
  };
}
