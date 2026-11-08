import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import RAPIER from "@dimforge/rapier3d-compat";

/** Preserve primitive geometry while avoiding the pinned narrow phase's degenerate zero-axis capsule path. */
export function physicalNativeShape(shape: P.IShape): RAPIER.Shape {
  if (
    shape.kind === "sphere" ||
    (shape.kind === "capsule" && shape.halfLength === 0)
  )
    return new RAPIER.Ball(shape.radius);
  return shape.kind === "capsule"
    ? new RAPIER.Capsule(shape.halfLength, shape.radius)
    : new RAPIER.Cuboid(
        shape.halfExtents.x,
        shape.halfExtents.y,
        shape.halfExtents.z,
      );
}
