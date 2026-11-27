import { AutoMovieEnginePhysicalGeometry as Geometry, AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * Selected receiver surfaces follow their bone frame and agree with independent
 * native closest-point queries.
 *
 * Scenarios:
 *
 * 1. Sphere, capsule and box support witnesses lie on the exact collider under two
 *    composed rotations.
 * 2. Moving outward along the selected normal projects back to that same surface
 *    witness.
 */
export async function test_engine_physics_physical_shape_surface(): Promise<void> {
  const geometry: IAutoMoviePreparePhysicalGeometry.IQueries = await Geometry.prepare();
  const pose: IAutoMovieRigidTransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 55),
  };
  const transform: IAutoMovieRigidTransform = {
    position: { x: 0.1, y: -0.2, z: 0.3 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 35),
  };
  const shapes: IAutoMoviePhysicalShape[] = [
    { id: "sphere", material: "solid", kind: "sphere", radius: 0.1, transform },
    {
      id: "capsule",
      material: "solid",
      kind: "capsule",
      radius: 0.1,
      halfLength: 0.3,
      transform,
    },
    {
      id: "box",
      material: "solid",
      kind: "box",
      halfExtents: { x: 0.2, y: 0.3, z: 0.4 },
      transform,
    },
  ];
  const findings: string[] = [];
  for (const shape of shapes)
    for (const normal of [
      { x: 1, y: 0, z: 0 },
      { x: 0.3, y: 0.6, z: 0.2 },
    ]) {
      const anchor: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeSurfaceAnchor> =
        AutoMovieEnginePhysics.physicalShapeSurfaceAnchor(pose, shape, normal);
      const projected: IAutoMovieRigidTransform["position"] = geometry.project(
        { body: "object", bone: "part", shape, pose },
        AutoMovieEngineVector3.add(anchor.point, AutoMovieEngineVector3.scale(anchor.normal, 0.01)),
      );
      if (
        AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(anchor.point, projected)) >
          PhysicalTolerance.CONVERGED ||
        Math.abs(AutoMovieEngineVector3.length(anchor.normal) - 1) >
          PhysicalTolerance.ACCUMULATED
      )
        findings.push(`${shape.kind}: invalid world surface witness`);
    }
  TestValidator.equals("all native surface witnesses", findings, []);
}
