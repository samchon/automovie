import { Quaternion, physicalShapeBounds } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMoviePrimitiveShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Exact lowest world Y of one rigid primitive used by a rest cycle.
 *
 * @param part Source or posed primitive with finite unit-scale transform.
 * @returns The lowest surface height, metres; a drawing plane has no solid and
 *   gives Infinity.
 * @throws {RangeError} For unsupported non-primitive geometry or malformed
 *   dimensions/transforms.
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
  if (dimensions.some((value: number): boolean => !(value > 0)))
    throw new RangeError(
      `Rest requires positive finite dimensions: ${part.id}`,
    );
  for (const axis of ["x", "y", "z"] as const)
    if (part.transform.scale[axis] !== 1)
      throw new RangeError(`Rest requires a finite rigid part: ${part.id}`);
  const rotation: IAutoMovieQuaternion = part.transform.rotation;
  const norm: number = Math.hypot(
    rotation.x,
    rotation.y,
    rotation.z,
    rotation.w,
  );
  if (!(Math.abs(norm - 1) <= 64 * Number.EPSILON))
    throw new RangeError(`Rest requires a unit rotation: ${part.id}`);
  const base: Pick<IAutoMoviePhysicalShape, "id" | "material" | "transform"> = {
    id: part.id,
    material: "rest-bound",
    transform: {
      position: part.transform.translation,
      rotation: Quaternion.normalize(part.transform.rotation),
    },
  };
  const placement: IAutoMovieRigidTransform = {
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
