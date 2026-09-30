import { createHumanObservation } from "@automovie/playground/src/human/common/observation/createHumanObservation";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * Named views frame the displayed subject the way the on-screen fit frames it,
 * and exact placement lifts the orbit's own limits so it is not pulled back.
 *
 * Scenarios:
 * 1. A unit cube centred at (0, 1, 0) has a bounding sphere of radius
 *    sqrt(3)/2. At a 30 degree vertical field and aspect 1, `view("front")`
 *    stands at 1.1 r / sin(15 degrees) in front of the centre and looks at it.
 * 2. `view("left")` at the same fit stands the same distance toward +X.
 * 3. An explicit distance and field replace the fitted ones.
 * 4. `frame` of a region of radius 0.1 m at (0.5, 1.5, 0) from the back stands
 *    1.1 * 0.1 / sin(15 degrees) behind that point.
 * 5. `look` places the camera exactly, sets the field, and lifts the orbit's
 *    damping and distance limits.
 * 6. Negative twin: with nothing displayed, a view falls back to a finite
 *    distance about the origin instead of failing.
 * 7. A companion outside the roots does not change the fit: a far companion
 *    leaves the distance as before.
 */
export const test_human_observation_framing = (): void => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  const orbit = {
    target: new THREE.Vector3(),
    enableDamping: true,
    minDistance: 0.1,
    maxDistance: 10,
    update: () => {},
  };
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial(),
  );
  cube.position.set(0, 1, 0);
  const subject = new THREE.Group();
  subject.add(cube);
  const companion = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial(),
  );
  companion.position.set(40, 0, 0);
  scene.add(subject, companion);
  cube.updateMatrixWorld(true);
  companion.updateMatrixWorld(true);
  let roots: THREE.Object3D[] = [subject];
  const { hooks } = createHumanObservation({
    scene,
    camera,
    orbit,
    roots: () => roots,
    clay: new THREE.MeshBasicMaterial(),
    height: () => 600,
  });
  const distance = (1.1 * (Math.sqrt(3) / 2)) / Math.sin(Math.PI / 12);

  hooks.view("front");
  TestValidator.predicate(
    "front stands at the fitted distance in front of the centre",
    nclose(camera.position.z, distance, 1e-9) &&
      nclose(camera.position.y, 1, 1e-9) &&
      nclose(camera.position.x, 0, 1e-9) &&
      nclose(orbit.target.y, 1, 1e-9),
  );
  hooks.view("left");
  TestValidator.predicate(
    "left stands the same distance toward +X",
    nclose(camera.position.x, distance, 1e-9) &&
      nclose(camera.position.z, 0, 1e-9),
  );
  hooks.view("front", { distance: 5, fov: 20 });
  TestValidator.predicate(
    "explicit distance and field",
    nclose(camera.position.z, 5, 1e-9) && camera.fov === 20,
  );

  hooks.frame({ center: [0.5, 1.5, 0], radius: 0.1, view: "back", fov: 30 });
  TestValidator.predicate(
    "frame stands behind the region at its own fit",
    nclose(camera.position.z, -(1.1 * 0.1) / Math.sin(Math.PI / 12), 1e-9) &&
      nclose(camera.position.x, 0.5, 1e-9) &&
      nclose(orbit.target.y, 1.5, 1e-9),
  );

  hooks.look({ position: [1, 2, 3], target: [0, 1, 0], fov: 45 });
  TestValidator.predicate(
    "look places exactly and lifts the orbit limits",
    camera.position.x === 1 &&
      camera.position.y === 2 &&
      camera.position.z === 3 &&
      camera.fov === 45 &&
      orbit.enableDamping === false &&
      orbit.minDistance === 0 &&
      orbit.maxDistance === Infinity,
  );

  roots = [];
  hooks.view("front", { fov: 30 });
  TestValidator.predicate(
    "an empty scene falls back to a finite distance about the origin",
    Number.isFinite(camera.position.z) &&
      camera.position.z > 0 &&
      orbit.target.length() === 0,
  );

  roots = [subject];
  hooks.view("front", { fov: 30 });
  TestValidator.predicate(
    "a companion outside the roots does not change the fit",
    nclose(camera.position.z, distance, 1e-9),
  );
};
