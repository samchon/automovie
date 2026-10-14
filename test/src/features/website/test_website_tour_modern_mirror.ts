import { modernMesh } from "@automovie/website/modern-scene";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

import { nclose } from "../internal/predicates";
import { modernItem } from "../internal/websiteTourFixture";

/**
 * Mirror rebasing keeps the actual emitted surface in world metres.
 * Scenarios:
 * 1. A plane facing world +X remains at its original vertices after local rebasing.
 * 2. An inspection face or section uses its opaque native finish instead of reflection.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the website native mesh alias, verifies the reflector arm and independently reconstructs each world vertex after rebasing; incorrect local-plane rotation/translation or reflective inspection surfaces fail.
 * @evidence contracts/testing.md#independent-expectations The independently authored +X triangle and item translation determine expected world vertices by addition, not by reading rebased output; nclose compares the resulting distance to zero at the existing 1e-6 tolerance, and reflector identity distinguishes display policy.
 * @evidence contracts/testing.md#distinguishing-cases Covers an ordinary mirror and its inspection-face/inspection-section negative twins, preserving all three triangle vertices; other plane normals, closed thickness, native reflections and cleanup failures are not exercised.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_tour_modern_mirror entry owns CPU geometry/matrix and reflector-construction observations through the website seam; no renderer/GPU or browser runs, and disposal is a resource request rather than observed native target release.
 */
export function test_website_tour_modern_mirror(): void {
  const item: ReturnType<typeof modernItem> = modernItem();
  item.faceId = "mirror";
  item.positions = [1, 0, 0, 1, 1, 0, 1, 0, 1];
  item.normals = [1, 0, 0, 1, 0, 0, 1, 0, 0];
  const mirror: ReturnType<typeof modernMesh> = modernMesh(
    item,
    new Map<string, THREE.Texture>(),
  );
  TestValidator.predicate("native mirror", mirror instanceof Reflector);
  mirror.updateMatrixWorld(true);
  const vertices: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    mirror.geometry.getAttribute("position");
  for (let i: number = 0; i < 3; i++) {
    const world: THREE.Vector3 = new THREE.Vector3()
      .fromBufferAttribute(vertices, i)
      .applyMatrix4(mirror.matrixWorld);
    const expected: THREE.Vector3 = new THREE.Vector3(
      ...item.positions.slice(i * 3, i * 3 + 3),
    ).add(new THREE.Vector3(...item.position));
    TestValidator.predicate(
      "world vertex preserved",
      nclose(world.distanceTo(expected), 0, 1e-6) &&
        world.distanceTo(expected) < 1e-6,
    );
  }
  item.inspectionFace = true;
  TestValidator.predicate(
    "identification face is ordinary mesh",
    !(modernMesh(item, new Map<string, THREE.Texture>()) instanceof Reflector),
  );
  item.inspectionFace = false;
  item.inspectionSection = true;
  TestValidator.predicate(
    "section is ordinary mesh",
    !(modernMesh(item, new Map<string, THREE.Texture>()) instanceof Reflector),
  );
  (mirror as Reflector).dispose();
}
