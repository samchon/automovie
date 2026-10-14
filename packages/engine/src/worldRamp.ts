import { IAutoMovieWorldSurface } from "@automovie/interface";

/**
 * Construct a rectangular planar ramp from a centerline, width and rise.
 *
 * @evidence contracts/common.md#principled-implementation The normalized perpendicular gives footprint half-width, while projection onto the centerline gives plane slopes and origin height; direct squared length must be finite and positive, retaining tiny/huge-coordinate precision limits.
 * @evidence contracts/common.md#clear-and-simple-design The constructor stores the existing plane height rule, which shared surfaceHeightAt evaluates without retaining a second ramp callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Blank id, nonpositive/nonfinite width, nonfinite base/rise and unusable squared axis throw; finite accepted fields do not universally prevent collapsed corners or overflow in derived plane coefficients.
 * @evidence contracts/common.md#meaningful-documentation Documents world XZ endpoints and metre width/base/rise, rectangular footprint order, extrapolated plane semantics and remaining representability premises.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar arithmetic and four fresh footprint points take constant time/space plus id validation; no lattice or mesh is generated.
 * @evidence contracts/performance.md#reuse-equivalent-work One centerline length supplies both width offset and plane coefficients; no cheap coefficient cache is retained across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh footprint/rule records, while input endpoints and any host resources are not retained; current helper callers are tests.
 * @author Samchon
 */
export const worldRamp: (input: {
  id: string;
  from: { x: number; z: number };
  to: { x: number; z: number };
  width: number;
  baseHeight: number;
  rise: number;
  walkable: boolean;
}) => IAutoMovieWorldSurface = (input: {
  id: string;
  from: { x: number; z: number };
  to: { x: number; z: number };
  width: number;
  baseHeight: number;
  rise: number;
  walkable: boolean;
}): IAutoMovieWorldSurface => {
  assertText(input.id, "World ramp id");
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

/** Require non-whitespace ramp identity before deriving its footprint and plane. */
const assertText: (value: string, field: string) => void = (
  value: string,
  field: string,
): void => {
  if (value.trim().length === 0)
    throw new Error(`${field} must contain non-whitespace text.`);
};
