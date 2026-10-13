import assert from "node:assert/strict";
import { createViewerCameraState } from "@automovie/viewer";
import * as THREE from "three";

/**
 * Native camera transfer retains film/view-offset lenses and transformations.
 * Invalid or unsupported state must fail before mutating the resident camera.
 * These are CPU-only native camera cases, with no renderer or Human fixture.
 */
export const test_viewer_camera_transfer = async (): Promise<void> => {
  for (const camera of [new THREE.PerspectiveCamera(42, 1.6, 0.1, 120),
    new THREE.OrthographicCamera(-3, 3, 2, -2, 0, 120)]) {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.filmGauge = 50; camera.filmOffset = 3; camera.focus = 15;
    }
    camera.position.set(1, 2, 3); camera.lookAt(0, 0, 0);
    camera.scale.set(1.2, 1.1, 0.9); camera.layers.set(3);
    camera.zoom = 1.4;
    camera.setViewOffset(1600, 1000, 150, 70, 900, 700);
    if (camera instanceof THREE.PerspectiveCamera) camera.aspect = 1.4;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    const owner = createViewerCameraState(camera);
    const state = owner.capture();
    camera.clearViewOffset(); camera.position.set(8, 9, 10); camera.zoom = 0.7;
    camera.updateProjectionMatrix();
    owner.restore(state);
    assert.deepEqual(owner.capture(), state);
    for (const invalid of [null, { ...state, type: "unknown" },
      { ...state, quaternion: [0, 0, 0, 0] }, { ...state, projection: new Array(16).fill(0) },
      { ...state, position: [NaN, 0, 0] }, { ...state, scale: [1, 0, 1] },
      { ...state, up: [0, 0, 0] }, { ...state, layers: 0.5 },
      { ...state, scale: [1e308, 1e308, 1e308], quaternion: [1e308, 1e308, 1e308, 1e308] },
      { ...state, scale: [1e308, 1e308, 1e308] },
      { ...state, view: { ...state.view, width: 0 } },
      { ...state, view: undefined }, { ...state, view: { ...state.view, enabled: "yes" } },
      { ...state, view: { ...state.view, offsetX: Infinity } },
      { ...state, lens: null }, { ...state, lens: { ...state.lens, kind: "unknown" } },
      { ...state, lens: { ...state.lens, near: NaN } },
      { ...state, lens: { ...state.lens, zoom: -1 } },
      { ...state, projection: state.projection.map((value, index) => index === 0 ? value + 1 : value) }]) {
      assert.throws(() => owner.restore(invalid));
      assert.deepEqual(owner.capture(), state);
    }
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    const disabled = owner.capture();
    owner.restore(disabled);
    assert.deepEqual(owner.capture(), disabled);
    camera.view = null; camera.updateProjectionMatrix();
    const whole = owner.capture(); owner.restore(whole);
    assert.deepEqual(owner.capture(), whole);
    camera.matrixAutoUpdate = false;
    assert.throws(() => owner.capture()); assert.throws(() => owner.restore(state));
    camera.matrixAutoUpdate = true; camera.matrixWorldAutoUpdate = false;
    assert.throws(() => owner.capture());
    camera.matrixWorldAutoUpdate = true;
    new THREE.Group().add(camera);
    assert.throws(() => owner.capture()); camera.removeFromParent();
    camera.projectionMatrix.elements[0] += 1;
    assert.throws(() => owner.capture());
  }
  assert.throws(() => createViewerCameraState(new THREE.Camera()).capture());
};
