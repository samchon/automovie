import {
  preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
  physicalShapeSurfaceAnchor,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Selected receiver surfaces follow their bone frame and agree with independent native closest-point queries.
 *
 * Scenarios:
 * 1. Sphere, capsule and box support witnesses lie on the exact collider under two composed rotations.
 * 2. Moving outward along the selected normal projects back to that same surface witness.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `physicalShapeSurfaceAnchor` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; 2 numbered scenarios (first: Sphere, capsule and box support witnesses lie on the exact collider under two composed rotations.; last: Moving outward along the selected normal projects back to that same surface witness.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 2 numbered scenarios (first: Sphere, capsule and box support witnesses lie on the exact collider under two composed rotations.; last: Moving outward along the selected normal projects back to that same surface witness.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_surface_anchor`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Sphere, capsule and box support witnesses lie on the exact collider under two composed rotations.).
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
