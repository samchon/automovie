import * as THREE from "three";

import type { IViewerCameraStateSnapshot } from "./IViewerCameraStateSnapshot.js";

/**
 * Transfer detached, auto-updating Perspective/Orthographic cameras through
 * their public native lens/transform API, including film and view offsets.
 * Parented, manual-matrix and custom-projection cameras are explicitly refused:
 * another owner must transfer those relationships rather than guess them. A
 * degenerate or non-finite state is refused before the original camera is
 * mutated.
 */
export function createViewerCameraState(camera: THREE.Camera): {
  capture: () => IViewerCameraStateSnapshot;
  restore: (state: IViewerCameraStateSnapshot) => void;
} {
  const supported: () =>
    | THREE.PerspectiveCamera
    | THREE.OrthographicCamera = ():
    | THREE.PerspectiveCamera
    | THREE.OrthographicCamera => {
    if (
      !(
        camera instanceof THREE.PerspectiveCamera ||
        camera instanceof THREE.OrthographicCamera
      ) ||
      camera.parent !== null ||
      !camera.matrixAutoUpdate ||
      !camera.matrixWorldAutoUpdate
    )
      throw new Error(
        "Camera transfer requires a detached auto-updating Perspective/Orthographic camera.",
      );
    return camera;
  };
  const capture: () => IViewerCameraStateSnapshot =
    (): IViewerCameraStateSnapshot => {
      const owned: THREE.PerspectiveCamera | THREE.OrthographicCamera =
        supported();
      const natural: THREE.PerspectiveCamera | THREE.OrthographicCamera =
        owned.clone();
      natural.updateProjectionMatrix();
      if (
        !natural.projectionMatrix.elements.every(
          (value: number, index: number): boolean =>
            value === owned.projectionMatrix.elements[index],
        )
      )
        throw new Error(
          "A custom projection requires its original projection owner.",
        );
      return {
        type: owned.type,
        position: owned.position.toArray(),
        quaternion: owned.quaternion.toArray(),
        scale: owned.scale.toArray(),
        up: owned.up.toArray(),
        layers: owned.layers.mask,
        projection: owned.projectionMatrix.toArray(),
        view: owned.view === null ? null : { ...owned.view },
        lens:
          owned instanceof THREE.PerspectiveCamera
            ? {
                kind: "perspective",
                fov: owned.fov,
                aspect: owned.aspect,
                near: owned.near,
                far: owned.far,
                zoom: owned.zoom,
                filmGauge: owned.filmGauge,
                filmOffset: owned.filmOffset,
                focus: owned.focus,
              }
            : {
                kind: "orthographic",
                left: owned.left,
                right: owned.right,
                top: owned.top,
                bottom: owned.bottom,
                near: owned.near,
                far: owned.far,
                zoom: owned.zoom,
              },
      };
    };
  const restore: (state: IViewerCameraStateSnapshot) => void = (
    state: IViewerCameraStateSnapshot,
  ): void => {
    const owned: THREE.PerspectiveCamera | THREE.OrthographicCamera =
      supported();
    if (state.type !== owned.type)
      throw new Error("Camera transfer changed camera type.");
    if (
      ![
        ...state.position,
        ...state.quaternion,
        ...state.scale,
        ...state.up,
        ...state.projection,
      ].every(Number.isFinite)
    )
      throw new Error("Camera transfer has a non-finite pose/projection.");
    const determinant: number = new THREE.Matrix4()
      .fromArray(state.projection)
      .determinant();
    if (
      !(Math.hypot(...state.quaternion) > 0) ||
      !(Math.hypot(...state.up) > 0) ||
      state.scale.some((value: number): boolean => value === 0) ||
      determinant === 0 ||
      !Number.isFinite(determinant)
    )
      throw new Error("Camera transfer has a degenerate pose/projection.");
    if (
      !Number.isInteger(state.layers) ||
      state.layers < -2147483648 ||
      state.layers > 4294967295
    )
      throw new Error("Camera transfer has no valid layer mask.");
    const candidate: THREE.PerspectiveCamera | THREE.OrthographicCamera =
      owned.clone();
    const lens: IViewerCameraStateSnapshot["lens"] = state.lens;
    if (candidate instanceof THREE.PerspectiveCamera) {
      if (lens.kind !== "perspective")
        throw new Error("Camera transfer changed projection type.");
      if (
        ![
          lens.fov,
          lens.aspect,
          lens.near,
          lens.far,
          lens.zoom,
          lens.filmGauge,
          lens.filmOffset,
          lens.focus,
        ].every(Number.isFinite) ||
        !(
          lens.fov > 0 &&
          lens.fov < 180 &&
          lens.aspect > 0 &&
          lens.near > 0 &&
          lens.far > lens.near &&
          lens.zoom > 0 &&
          lens.filmGauge > 0 &&
          lens.focus > 0
        )
      )
        throw new Error("Camera transfer lens is invalid.");
      Object.assign(candidate, {
        fov: lens.fov,
        aspect: lens.aspect,
        near: lens.near,
        far: lens.far,
        zoom: lens.zoom,
        filmGauge: lens.filmGauge,
        filmOffset: lens.filmOffset,
        focus: lens.focus,
      });
    } else {
      if (lens.kind !== "orthographic")
        throw new Error("Camera transfer changed projection type.");
      if (
        ![
          lens.left,
          lens.right,
          lens.top,
          lens.bottom,
          lens.near,
          lens.far,
          lens.zoom,
        ].every(Number.isFinite) ||
        !(
          lens.right > lens.left &&
          lens.top > lens.bottom &&
          lens.near >= 0 &&
          lens.far > lens.near &&
          lens.zoom > 0
        )
      )
        throw new Error("Camera transfer lens is invalid.");
      Object.assign(candidate, {
        left: lens.left,
        right: lens.right,
        top: lens.top,
        bottom: lens.bottom,
        near: lens.near,
        far: lens.far,
        zoom: lens.zoom,
      });
    }
    const view: IViewerCameraStateSnapshot["view"] = state.view;
    if (view !== null) {
      if (
        ![
          view.fullWidth,
          view.fullHeight,
          view.offsetX,
          view.offsetY,
          view.width,
          view.height,
        ].every(Number.isFinite)
      )
        throw new Error("Camera transfer has no finite view offset.");
      if (
        !(
          view.fullWidth > 0 &&
          view.fullHeight > 0 &&
          view.width > 0 &&
          view.height > 0
        )
      )
        throw new Error("Camera transfer view dimensions are invalid.");
      candidate.setViewOffset(
        view.fullWidth,
        view.fullHeight,
        view.offsetX,
        view.offsetY,
        view.width,
        view.height,
      );
      candidate.view!.enabled = view.enabled;
    } else candidate.view = null;
    // setViewOffset also writes Perspective.aspect. A later native resize may
    // legitimately have changed that lens while preserving the crop window.
    if (
      candidate instanceof THREE.PerspectiveCamera &&
      lens.kind === "perspective"
    )
      candidate.aspect = lens.aspect;
    candidate.updateProjectionMatrix();
    if (
      !candidate.projectionMatrix.elements.every(
        (value: number, index: number): boolean =>
          value === state.projection[index],
      )
    )
      throw new Error(
        "The projection does not match the transferred native lens.",
      );
    candidate.position.fromArray(state.position);
    candidate.quaternion.fromArray(state.quaternion);
    candidate.scale.fromArray(state.scale);
    candidate.up.fromArray(state.up);
    candidate.layers.mask = state.layers;
    candidate.updateMatrixWorld(true);
    const worldDeterminant: number = candidate.matrixWorld.determinant();
    if (
      !candidate.matrixWorld.elements.every(Number.isFinite) ||
      worldDeterminant === 0 ||
      !Number.isFinite(worldDeterminant)
    )
      throw new Error("The transferred camera world transform is degenerate.");
    if (
      owned instanceof THREE.PerspectiveCamera &&
      candidate instanceof THREE.PerspectiveCamera
    )
      owned.copy(candidate, false);
    else if (
      owned instanceof THREE.OrthographicCamera &&
      candidate instanceof THREE.OrthographicCamera
    )
      owned.copy(candidate, false);
    else throw new Error("The validated camera projection changed type.");
    owned.updateMatrixWorld(true);
  };
  return { capture, restore };
}
