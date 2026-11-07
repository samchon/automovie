import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { physicalShapeSurfaceAnchor } from "../../../../packages/engine/src/physics/physicalShapeSurfaceAnchor";
import { preparePhysicalGeometry as Geometry } from "../../../../packages/engine/src/physics/preparePhysicalGeometry";

/** Selected receiver surfaces follow their bone frame and agree with independent native closest-point queries.
 *
 * Scenarios:
 * 1. Sphere, capsule and box support witnesses lie on the exact collider under two composed rotations.
 * 2. Moving outward along the selected normal projects back to that same surface witness.
 */
export async function test_physical_surface_anchor(): Promise<void> {
  const geometry: Geometry.IQueries = await Geometry();
  const pose: P.ITransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 55),
  };
  const transform: P.ITransform = {
    position: { x: 0.1, y: -0.2, z: 0.3 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 35),
  };
  const shapes: P.IShape[] = [
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
      const anchor: ReturnType<typeof physicalShapeSurfaceAnchor> =
        physicalShapeSurfaceAnchor(pose, shape, normal);
      const projected: P.ITransform["position"] = geometry.project(
        { body: "object", bone: "part", shape, pose },
        Vector3.add(anchor.point, Vector3.scale(anchor.normal, 0.01)),
      );
      if (
        Vector3.length(Vector3.subtract(anchor.point, projected)) > 1e-6 ||
        Math.abs(Vector3.length(anchor.normal) - 1) > 1e-10
      )
        findings.push(`${shape.kind}: invalid world surface witness`);
    }
  TestValidator.equals("all native surface witnesses", findings, []);
}
