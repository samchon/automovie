import { AutoMovieThreeKind } from "@automovie/render";
import {
  type IViewerCameraStateSnapshot,
  createViewerCameraState,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";
import * as THREE from "three";

import { nclose } from "../../internal/predicates";

/** A native camera's crop window, as its snapshot holds it. */
type IViewerCropWindow = NonNullable<IViewerCameraStateSnapshot["view"]>;

/**
 * Native camera transfer preserves film/view-offset lenses and transforms,
 * refusing invalid or unsupported state before resident mutation. These cases
 * observe CPU camera state without a renderer or Human fixture.
 *
 * Scenarios:
 *
 * 1. Perspective and orthographic lenses, cropped views, TRS and layers match
 *    authored values before and after transfer.
 * 2. A changed class or degenerate or invalid restore fields refuse without
 *    changing the resident state; disabled and absent views remain supported.
 * 3. Manual matrix ownership, parenting, custom projection and an unsupported
 *    camera class refuse capture or restore.
 */
export async function test_viewer_root_create_camera_state(): Promise<void> {
  for (const camera of [
    new THREE.PerspectiveCamera(42, 1.6, 0.1, 120),
    new THREE.OrthographicCamera(-3, 3, 2, -2, 0, 120),
  ]) {
    if (AutoMovieThreeKind.isPerspectiveCamera(camera)) {
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
    if (AutoMovieThreeKind.isPerspectiveCamera(camera)) camera.aspect = 1.4;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    const crop: IViewerCropWindow = {
      enabled: true,
      fullWidth: 1600,
      fullHeight: 1000,
      offsetX: 150,
      offsetY: 70,
      width: 900,
      height: 700,
    };
    const expected: IViewerCameraStateSnapshot = {
      type: camera.type,
      position: [1, 2, 3],
      quaternion: camera.quaternion.toArray(),
      scale: [1.2, 1.1, 0.9],
      up: [0, 1, 0],
      layers: 1 << 3,
      projection: camera.projectionMatrix.toArray(),
      view: crop,
      lens: AutoMovieThreeKind.isPerspectiveCamera(camera)
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
      const lens: (
        snapshot: IViewerCameraStateSnapshot,
      ) => Record<string, number> = (
        snapshot: IViewerCameraStateSnapshot,
      ): Record<string, number> => {
        const { kind: _kind, ...scalars }: IViewerCameraStateSnapshot["lens"] =
          snapshot.lens;
        return scalars;
      };
      const observed: Record<string, number> = lens(actual);
      for (const [field, value] of Object.entries(lens(reference))) {
        const seen: number | undefined = observed[field];
        TestValidator.predicate(
          "native lens " + field + " is preserved",
          seen !== undefined && nclose(seen, value, 0),
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
    const shifted: THREE.Matrix4 = new THREE.Matrix4().fromArray(
      state.projection,
    );
    shifted.elements[0] += 1;
    const invalids: IViewerCameraStateSnapshot[] = [
      { ...state, type: "unknown" },
      { ...state, quaternion: [0, 0, 0, 0] },
      { ...state, projection: new THREE.Matrix4().multiplyScalar(0).toArray() },
      { ...state, scale: [1, 0, 1] },
      { ...state, up: [0, 0, 0] },
      {
        ...state,
        scale: [1e308, 1e308, 1e308],
        quaternion: [1e308, 1e308, 1e308, 1e308],
      },
      { ...state, scale: [1e308, 1e308, 1e308] },
      { ...state, view: { ...crop, width: 0 } },
      { ...state, lens: { ...state.lens, zoom: -1 } },
      { ...state, projection: shifted.toArray() },
    ];
    for (const invalid of invalids) {
      assert.throws((): void => owner.restore(invalid));
      assertState(expected);
    }
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    const disabledExpected: IViewerCameraStateSnapshot = {
      ...expected,
      projection: camera.projectionMatrix.toArray(),
      view: { ...crop, enabled: false },
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
