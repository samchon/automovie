import { modernMesh } from "@automovie/website/modern-scene";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

import { modernItem } from "../internal/websiteTourFixture";

/**
 * Mirror rebasing keeps the actual emitted surface in world metres.
 * Scenarios:
 * 1. A plane facing world +X remains at its original vertices after local rebasing.
 * 2. An inspection face or section uses its opaque native finish instead of reflection.
 */
export const test_website_tour_modern_mirror = (): void => {
  const item = modernItem();
  item.faceId = "mirror";
  item.positions = [1, 0, 0, 1, 1, 0, 1, 0, 1];
  item.normals = [1, 0, 0, 1, 0, 0, 1, 0, 0];
  const mirror = modernMesh(item, new Map());
  TestValidator.predicate("native mirror", mirror instanceof Reflector);
  mirror.updateMatrixWorld(true);
  const vertices = mirror.geometry.getAttribute("position");
  for (let i = 0; i < 3; i++) {
    const world = new THREE.Vector3()
      .fromBufferAttribute(vertices, i)
      .applyMatrix4(mirror.matrixWorld);
    const expected = new THREE.Vector3(
      ...item.positions.slice(i * 3, i * 3 + 3),
    ).add(new THREE.Vector3(...item.position));
    TestValidator.predicate(
      "world vertex preserved",
      world.distanceTo(expected) < 1e-6,
    );
  }
  item.inspectionFace = true;
  TestValidator.predicate(
    "identification face is ordinary mesh",
    !(modernMesh(item, new Map()) instanceof Reflector),
  );
  item.inspectionFace = false;
  item.inspectionSection = true;
  TestValidator.predicate(
    "section is ordinary mesh",
    !(modernMesh(item, new Map()) instanceof Reflector),
  );
  (mirror as Reflector).dispose();
};
