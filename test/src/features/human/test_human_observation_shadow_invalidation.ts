import { createHumanObservation } from "@automovie/playground/src/human/common/observation/createHumanObservation";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Shadow refresh requests follow visible casters and the observation pass,
 * while an unchanged frame or camera placement requests no extra refresh.
 *
 * Scenarios:
 * 1. Isolation removes a caster and restoration invalidates it again.
 * 2. Repeated isolation and a camera-only change do not invalidate shadows.
 * 3. Hiding composes with isolation; changing a pass invalidates once.
 * 4. A mesh hidden by its caller remains hidden without a false invalidation.
 */
export const test_human_observation_shadow_invalidation = (): void => {
  const root = new THREE.Group();
  const head = new THREE.Mesh(); head.name = "head";
  const body = new THREE.Mesh(); body.name = "body";
  root.add(head, body);
  let invalidations = 0;
  const observation = createHumanObservation({
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    orbit: { target: new THREE.Vector3(), enableDamping: false,
      minDistance: 0, maxDistance: 10, update: () => {} },
    roots: () => [root],
    clay: new THREE.MeshBasicMaterial(),
    height: () => 320,
    invalidateShadows: () => { ++invalidations; },
  });
  observation.apply();
  TestValidator.equals("unused observation requests no shadow refresh", invalidations, 0);
  observation.hooks.isolate(["body"]); observation.apply();
  TestValidator.equals("caster removal invalidates", [head.visible, invalidations], [false, 1]);
  observation.hooks.isolate(["body"]); observation.apply();
  TestValidator.equals("same caster population requests no extra shadow refresh", invalidations, 1);
  observation.hooks.look({ position: [0, 0, 1], target: [0, 0, 0], fov: 30 });
  observation.apply();
  TestValidator.equals("camera does not move a caster", invalidations, 1);
  observation.hooks.isolate(null); observation.apply();
  TestValidator.equals("caster restoration invalidates", [head.visible, invalidations], [true, 2]);
  observation.hooks.hide(["head"]); observation.apply();
  TestValidator.equals("hide invalidates", invalidations, 3);
  observation.hooks.isolate(["body"]); observation.apply();
  TestValidator.equals("already hidden caster requests no extra shadow refresh", invalidations, 3);
  observation.hooks.pass("clay"); observation.apply();
  TestValidator.equals("pass changes shadow material policy", invalidations, 4);
  observation.hooks.pass("clay"); observation.apply();
  TestValidator.equals("same pass requests no extra shadow refresh", invalidations, 4);
  observation.hooks.hide(null); observation.hooks.isolate(null); observation.apply();
  TestValidator.equals("restore visibility", invalidations, 5);
  head.visible = false;
  observation.hooks.hide(["head"]); observation.apply();
  observation.hooks.hide(null); observation.apply();
  TestValidator.equals("caller-hidden caster is preserved", [head.visible, invalidations], [false, 5]);
};
