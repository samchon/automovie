import type { IAutoMoviePrimitiveShape, IAutoMovieModelPart, IAutoMoviePhysicalProfile, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion, physicalShapeBounds } from "@automovie/engine";


/**
 * Exact lowest world Y of one rigid primitive used by a rest cycle.
 *
 * @param part Actual source or posed primitive with finite unit-scale transform.
 * @returns The lowest surface height, metres; a drawing plane has no solid and gives Infinity.
 * @throws {RangeError} For unsupported non-primitive geometry or malformed dimensions/transforms.
 * @evidence contracts/development/common.md#meaningful-documentation States the rigid primitive domain, floor-height meaning, plane exclusion and refusal behavior.
 * @evidence contracts/development/implementation.md#principled-implementation Engine physicalShapeBounds supplies exact sphere, box and capsule extrema. The missing cylinder/cone primitives use their support function in world -Y: a cylinder's radial projection is r times the horizontal length of its unit axis, and a cone selects the lowest of its base rim and apex.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit actual positive primitive dimensions and a rigid transform, delegate engine-supported exact bounds, and handle only the two primitive forms the physical shape union cannot express without approximation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No padded floor tolerance, species case, inner cylinder capsule or mesh-bound guess hides penetration; unsupported geometry is refused.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and storage per primitive, with at most three rotated axes for a box.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing engine's exact physical-shape bound owner for its supported solids; each actual current transform is measured afresh because different poses cannot reuse a completed bound.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Uses call-local scalar/vector records and retains no model, buffers, cache or external resources.
 */
export function QuadrupedRestFloor(part: IAutoMovieModelPart): number {
  if (
    part.geometry.type !== "primitive" ||
    part.transform === null ||
    part.transform === undefined
  )
    throw new RangeError(`Rest requires a transformed primitive: ${part.id}`);
  const shape: IAutoMoviePrimitiveShape = part.geometry.shape;
  if (shape.type === "plane") return Infinity;
  const dimensions: readonly number[] =
    shape.type === "box"
      ? [shape.width, shape.height, shape.depth]
      : shape.type === "sphere"
        ? [shape.radius]
        : [shape.height, shape.radius];
  if (
    dimensions.some(
      (value: number): boolean => !(Number.isFinite(value) && value > 0),
    )
  )
    throw new RangeError(
      `Rest requires positive finite dimensions: ${part.id}`,
    );
  for (const axis of ["x", "y", "z"] as const)
    if (
      part.transform.scale[axis] !== 1 ||
      !Number.isFinite(part.transform.translation[axis])
    )
      throw new RangeError(`Rest requires a finite rigid part: ${part.id}`);
  const rotation: IAutoMovieQuaternion = part.transform.rotation;
  const norm: number = Math.hypot(
    rotation.x,
    rotation.y,
    rotation.z,
    rotation.w,
  );
  if (!(Number.isFinite(norm) && Math.abs(norm - 1) <= 64 * Number.EPSILON))
    throw new RangeError(`Rest requires a unit rotation: ${part.id}`);
  const base: Pick<
    IAutoMoviePhysicalProfile.IShape,
    "id" | "material" | "transform"
  > = {
    id: part.id,
    material: "rest-bound",
    transform: {
      position: part.transform.translation,
      rotation: Quaternion.normalize(part.transform.rotation),
    },
  };
  const placement: IAutoMoviePhysicalProfile.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  if (shape.type === "sphere")
    return physicalShapeBounds(placement, {
      ...base,
      kind: "sphere",
      radius: shape.radius,
    }).min.y;
  if (shape.type === "capsule")
    return physicalShapeBounds(placement, {
      ...base,
      kind: "capsule",
      radius: shape.radius,
      halfLength: shape.height / 2,
    }).min.y;
  if (shape.type === "box")
    return physicalShapeBounds(placement, {
      ...base,
      kind: "box",
      halfExtents: {
        x: shape.width / 2,
        y: shape.height / 2,
        z: shape.depth / 2,
      },
    }).min.y;
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(
    base.transform.rotation,
    { x: 0, y: 1, z: 0 },
  );
  const centre: number = part.transform.translation.y;
  const projected: number = Math.hypot(axis.x, axis.z);
  if (shape.type === "cone") {
    return Math.min(
      centre + (axis.y * shape.height) / 2 - shape.radius * projected,
      centre - (axis.y * shape.height) / 2,
    );
  }
  const extent: number =
    (Math.abs(axis.y) * shape.height) / 2 + shape.radius * projected;
  return centre - extent;
}
