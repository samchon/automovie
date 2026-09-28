import { createHumanFaceBasisBuilder } from "@automovie/human";
import { createConnectedFaceRenderer } from "@automovie/playground/src/human/connectedRenderer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Numerical preparation leaves the visible face untouched until publication.
 *
 * Scenarios:
 * 1. A shape edit reuses the resident GPU buffers and updates their bounds.
 * 2. A material change stages a separate group and releases the displaced one.
 * 3. Discarding stale, shared and already released frames preserves the display.
 * 4. Missing normals are reconstructed; an unnamed model uses its identity.
 */
export const test_subject_connected_renderer = async (): Promise<void> => {
  const { basis, document } = humanFaceBasisFixture();
  const build = createHumanFaceBasisBuilder(basis);
  const renderer = createConnectedFaceRenderer({
    loadTexture: async () => new THREE.Texture(),
    maxAnisotropy: 8,
  });
  const first = await renderer.prepare(build(document));
  const group = renderer.publish(first);
  const mesh = group.children[0] as THREE.Mesh;
  const position = mesh.geometry.getAttribute("position");
  let releases = 0;
  mesh.geometry.addEventListener("dispose", () => {
    releases++;
  });
  const changed = await renderer.prepare(
    build({ ...document, shape: { width: 1 } }),
  );
  TestValidator.equals(
    "preparation does not write display",
    position.getX(1),
    1,
  );
  renderer.dispose(changed);
  TestValidator.equals(
    "shared candidate disposal retains display",
    releases,
    0,
  );
  TestValidator.predicate(
    "resident group retained",
    renderer.publish(changed) === group,
  );
  TestValidator.predicate(
    "GPU buffer retained",
    mesh.geometry.getAttribute("position") === position,
  );
  TestValidator.equals("new numerical position", position.getX(1), 1.5);
  TestValidator.equals("updated bound", mesh.geometry.boundingBox!.max.x, 1.5);
  const replacement = await renderer.prepare(
    build({ ...document, materials: { skin: { roughness: 0.2 } } }),
  );
  TestValidator.equals("replacement remains staged", releases, 0);
  const second = renderer.publish(replacement);
  TestValidator.predicate("changed materials replace group", second !== group);
  TestValidator.equals("displaced geometry released", releases, 1);
  renderer.dispose(first);
  renderer.dispose(changed);
  TestValidator.equals("old frame disposal is idempotent", releases, 1);
  TestValidator.predicate(
    "released frame cannot publish",
    throwsError(() => renderer.publish(first)),
  );
  const stale = await renderer.prepare(build(document));
  let staleReleases = 0;
  stale.resident.meshes[0].geometry.addEventListener("dispose", () => {
    staleReleases++;
  });
  renderer.dispose(stale);
  renderer.dispose(stale);
  TestValidator.equals("unpublished resource released once", staleReleases, 1);
  const unnamed = build(document);
  unnamed.name = null;
  for (const part of unnamed.parts) {
    if (part.geometry.type !== "mesh")
      throw new Error("Expected analytic mesh.");
    part.geometry.mesh.normals = null;
  }
  const flat = renderer.publish(await renderer.prepare(unnamed));
  TestValidator.equals("identity fallback", flat.name, document.id);
  TestValidator.equals(
    "computed normal",
    (flat.children[0] as THREE.Mesh).geometry.getAttribute("normal").getZ(0),
    1,
  );
};
