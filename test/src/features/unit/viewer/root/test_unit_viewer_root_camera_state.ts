import { createViewerCameraState } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `createViewerCameraState` captures a detached camera's pose and lens and
 * restores them onto the same camera kind.
 *
 * Scenarios:
 *
 * 1. A perspective camera at (1, 2, 3) with fov 40 captures that pose and lens;
 *    moving it and restoring the capture puts both back.
 * 2. A camera inside a group is refused; an orthographic capture cannot be
 *    restored onto a perspective camera.
 */
export function test_unit_viewer_root_camera_state(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40);
  camera.position.set(1, 2, 3);
  const state: ReturnType<typeof createViewerCameraState> =
    createViewerCameraState(camera);
  const captured: ReturnType<typeof state.capture> = state.capture();
  TestValidator.predicate(
    "the captured pose and lens",
    captured.type === "PerspectiveCamera" &&
      captured.position.join() === "1,2,3" &&
      captured.lens.kind === "perspective" &&
      captured.lens.fov === 40,
  );
  camera.position.set(9, 9, 9);
  camera.fov = 70;
  camera.updateProjectionMatrix();
  state.restore(captured);
  TestValidator.equals(
    "restored",
    [camera.position.toArray(), camera.fov],
    [[1, 2, 3], 40],
  );
  const parented: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  new THREE.Group().add(parented);
  TestValidator.error("a parented camera", (): unknown =>
    createViewerCameraState(parented).capture(),
  );
  const orthographic: ReturnType<typeof state.capture> =
    createViewerCameraState(new THREE.OrthographicCamera()).capture();
  TestValidator.error("another camera kind", (): void =>
    state.restore(orthographic),
  );
}
