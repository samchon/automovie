import { createViewerCameraState } from "@automovie/viewer";
import type { IViewerCameraStateSnapshot } from "@automovie/viewer/IViewerCameraStateSnapshot";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * Native camera transfer preserves film/view-offset lenses and transforms, refusing invalid or unsupported state before resident mutation. These cases observe CPU camera state without a renderer or Human fixture.
 *
 * Scenarios:
 * 1. Perspective and orthographic lenses, cropped views, TRS and layers match authored values before and after transfer.
 * 2. Malformed restore fields refuse without changing the resident state; disabled and absent views remain supported.
 * 3. Manual matrix ownership, parenting, custom projection and an unsupported camera class refuse capture or restore.
 *
 * @evidence contracts/testing.md#behavioral-verification Captures and restores actual detached native perspective/orthographic cameras, checking lens, view, TRS, layers and projection fields against independently authored/native reference values. Invalid state must throw while leaving the resident state intact; unsupported parent/manual/custom-projection cameras refuse.
 * @evidence contracts/testing.md#independent-expectations Authored scalar/vector/lens/view values supply the oracle, with Three's own quaternion and projection APIs as the independent native reference. Every initial capture is checked against that reference before a round trip; exact finite scalar comparisons detect transfer drift without claiming a second projection derivation or GPU correctness.
 * @evidence contracts/testing.md#distinguishing-cases Covers both supported classes, enabled/disabled/absent crop state, malformed type/vector/lens/view/projection fields, overflowed transforms, manual matrix owners, parenting and custom projection. Every malformed-snapshot restore is followed by an unchanged-state assertion; the unsupported manual-matrix owner is checked for refusal only, and renderer pixel transfer belongs to host tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable async named unit performs synchronous portable operations on Three metadata objects and the production adapter. It installs no browser, renderer or GPU and registers all cases locally.
 */
export async function test_viewer_camera_transfer(): Promise<void> {
  for (const camera of [
    new THREE.PerspectiveCamera(42, 1.6, 0.1, 120),
    new THREE.OrthographicCamera(-3, 3, 2, -2, 0, 120),
  ]) {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.filmGauge = 50;
      camera.filmOffset = 3;
      camera.focus = 15;
    }
    camera.position.set(1, 2, 3);
    camera.lookAt(0, 0, 0);
    camera.scale.set(1.2, 1.1, 0.9);
    camera.layers.set(3);
    camera.zoom = 1.4;
    camera.setViewOffset(1600, 1000, 150, 70, 900, 700);
    if (camera instanceof THREE.PerspectiveCamera) camera.aspect = 1.4;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    const expected: IViewerCameraStateSnapshot = {
      type: camera.type,
      position: [1, 2, 3],
      quaternion: camera.quaternion.toArray(),
      scale: [1.2, 1.1, 0.9],
      up: [0, 1, 0],
      layers: 1 << 3,
      projection: camera.projectionMatrix.toArray(),
      view: {
        enabled: true,
        fullWidth: 1600,
        fullHeight: 1000,
        offsetX: 150,
        offsetY: 70,
        width: 900,
        height: 700,
      },
      lens:
        camera instanceof THREE.PerspectiveCamera
          ? {
              kind: "perspective",
              fov: 42,
              aspect: 1.4,
              near: 0.1,
              far: 120,
              zoom: 1.4,
              filmGauge: 50,
              filmOffset: 3,
              focus: 15,
            }
          : {
              kind: "orthographic",
              left: -3,
              right: 3,
              top: 2,
              bottom: -2,
              near: 0,
              far: 120,
              zoom: 1.4,
            },
    };
    const owner: ReturnType<typeof createViewerCameraState> =
      createViewerCameraState(camera);
    const assertState: (reference: IViewerCameraStateSnapshot) => void = (
      reference: IViewerCameraStateSnapshot,
    ): void => {
      const actual: IViewerCameraStateSnapshot = owner.capture();
      TestValidator.equals(
        "native class is preserved",
        actual.type,
        reference.type,
      );
      TestValidator.equals(
        "native layer mask is preserved",
        actual.layers,
        reference.layers,
      );
      TestValidator.equals(
        "native integer crop fields are preserved",
        actual.view,
        reference.view,
      );
      for (const field of [
        "position",
        "quaternion",
        "scale",
        "up",
        "projection",
      ] as const)
        TestValidator.predicate(
          "native " + field + " values are preserved",
          actual[field].length === reference[field].length &&
            actual[field].every((value: number, index: number): boolean =>
              nclose(value, reference[field][index]!, 0),
            ),
        );
      TestValidator.equals(
        "native lens class is preserved",
        actual.lens.kind,
        reference.lens.kind,
      );
      for (const [field, value] of Object.entries(reference.lens))
        if (typeof value === "number") {
          const observed: unknown = Reflect.get(actual.lens, field);
          TestValidator.predicate(
            "native lens " + field + " is preserved",
            typeof observed === "number" && nclose(observed, value, 0),
          );
        }
    };
    assertState(expected);
    const state: IViewerCameraStateSnapshot = owner.capture();
    camera.clearViewOffset();
    camera.position.set(8, 9, 10);
    camera.zoom = 0.7;
    camera.updateProjectionMatrix();
    owner.restore(state);
    assertState(expected);
    for (const invalid of [
      null,
      { ...state, type: "unknown" },
      { ...state, quaternion: [0, 0, 0, 0] },
      { ...state, projection: new Array(16).fill(0) },
      { ...state, position: [NaN, 0, 0] },
      { ...state, scale: [1, 0, 1] },
      { ...state, up: [0, 0, 0] },
      { ...state, layers: 0.5 },
      {
        ...state,
        scale: [1e308, 1e308, 1e308],
        quaternion: [1e308, 1e308, 1e308, 1e308],
      },
      { ...state, scale: [1e308, 1e308, 1e308] },
      { ...state, view: { ...state.view, width: 0 } },
      { ...state, view: undefined },
      { ...state, view: { ...state.view, enabled: "yes" } },
      { ...state, view: { ...state.view, offsetX: Infinity } },
      { ...state, lens: null },
      { ...state, lens: { ...state.lens, kind: "unknown" } },
      { ...state, lens: { ...state.lens, near: NaN } },
      { ...state, lens: { ...state.lens, zoom: -1 } },
      {
        ...state,
        projection: state.projection.map(
          (value: number, index: number): number =>
            index === 0 ? value + 1 : value,
        ),
      },
    ]) {
      assert.throws((): void => owner.restore(invalid));
      assertState(expected);
    }
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    const disabledExpected: IViewerCameraStateSnapshot = {
      ...expected,
      projection: camera.projectionMatrix.toArray(),
      view: { ...expected.view!, enabled: false },
    };
    assertState(disabledExpected);
    const disabled: IViewerCameraStateSnapshot = owner.capture();
    owner.restore(disabled);
    assertState(disabledExpected);
    camera.view = null;
    camera.updateProjectionMatrix();
    const wholeExpected: IViewerCameraStateSnapshot = {
      ...expected,
      projection: camera.projectionMatrix.toArray(),
      view: null,
    };
    assertState(wholeExpected);
    const whole: IViewerCameraStateSnapshot = owner.capture();
    owner.restore(whole);
    assertState(wholeExpected);
    camera.matrixAutoUpdate = false;
    assert.throws((): IViewerCameraStateSnapshot => owner.capture());
    assert.throws((): void => owner.restore(state));
    camera.matrixAutoUpdate = true;
    camera.matrixWorldAutoUpdate = false;
    assert.throws((): IViewerCameraStateSnapshot => owner.capture());
    camera.matrixWorldAutoUpdate = true;
    new THREE.Group().add(camera);
    assert.throws((): IViewerCameraStateSnapshot => owner.capture());
    camera.removeFromParent();
    camera.projectionMatrix.elements[0] += 1;
    assert.throws((): IViewerCameraStateSnapshot => owner.capture());
  }
  assert.throws(
    (): IViewerCameraStateSnapshot =>
      createViewerCameraState(new THREE.Camera()).capture(),
  );
}
