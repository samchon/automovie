import { Quaternion, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMoviePrimitiveShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeConvexCell } from "../../core";

/*
 * Exact lowest world Y of one posed rigid solid used by a rest cycle.
 * Parameter part: Source or posed part with finite unit-scale transform.
 * Parameter cells: The producer-owned convex cells, when the model supplies them.
 * Returns: The lowest surface height, metres; a drawing plane has no solid and
 * gives Infinity.
 * For an unregistered solid or malformed
 * dimensions/transforms.
 */
export function QuadrupedRestFloor(
  part: IAutoMovieModelPart,
  cells?: AutoMovieArchetypeConvexCell.Table,
): number {
  if (part.transform === null || part.transform === undefined)
    throw new RangeError(`Rest requires transformed rigid geometry: ${part.id}`);
  const shape: IAutoMoviePrimitiveShape | undefined =
    part.geometry.type === "primitive" ? part.geometry.shape : undefined;
  if (shape?.type === "plane") return Infinity;
  if (shape !== undefined) {
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
  }
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
  const unit: IAutoMovieQuaternion = Quaternion.normalize(rotation);
  if (shape === undefined) {
    const cell: AutoMovieArchetypeConvexCell.ICell | undefined = cells?.get(part.id);
    if (cell === undefined || cell.geometry !== part.geometry)
      throw new RangeError(`Rest requires matching convex material: ${part.id}`);
    // A linear coordinate on a closed convex cell takes its minimum at a corner.
    let minimum: number = Infinity;
    for (const point of cell.points)
      minimum = Math.min(minimum, Quaternion.rotateVectorY(unit, point));
    return part.transform.translation.y + minimum;
  }
  const base: Pick<IAutoMoviePhysicalShape, "id" | "material" | "transform"> = {
    id: part.id,
    material: "rest-bound",
    transform: {
      position: part.transform.translation,
      rotation: unit,
    },
  };
  const placement: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  if (shape.type === "sphere")
    return AutoMovieEnginePhysics.physicalShapeBounds(placement, {
      ...base,
      kind: "sphere",
      radius: shape.radius,
    }).min.y;
  if (shape.type === "capsule")
    return AutoMovieEnginePhysics.physicalShapeBounds(placement, {
      ...base,
      kind: "capsule",
      radius: shape.radius,
      halfLength: shape.height / 2,
    }).min.y;
  if (shape.type === "box")
    return AutoMovieEnginePhysics.physicalShapeBounds(placement, {
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
