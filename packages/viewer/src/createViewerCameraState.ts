import * as THREE from "three";

import type { IViewerCameraStateSnapshot } from "./IViewerCameraStateSnapshot.js";

/**
 * Transfer detached, auto-updating Perspective/Orthographic cameras through
 * their public native lens/transform API, including film and view offsets.
 * Parented, manual-matrix and custom-projection cameras are explicitly refused:
 * another owner must transfer those relationships rather than guess them.
 * All unknown state is validated before the original camera is mutated.
 *
 * @evidence contracts/common.md#principled-implementation Captures native detached auto-updating lens/TRS/view state and admits unknown input on a temporary camera clone, requiring finite dimensions, nondegenerate transforms and exact native projection parity before copy; custom/manual/parented cameras refuse, while non-unit quaternions are not normalized and only resulting finite invertibility is tested.
 * @evidence contracts/common.md#clear-and-simple-design Keeps capture and restore with the same native camera/lens owner, preserving view offsets/film settings instead of applying an unexplained raw matrix snapshot; a named transfer record describes existing fields without another projection solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual native projection recomputation and exact parity rather than fixture lens defaults, patched matrix methods or tolerance-based acceptance of an unsupported custom projection.
 * @evidence contracts/common.md#meaningful-documentation States detached/auto-updating supported classes, refused custom state and admission-before-mutation; the transfer record's field docs give vector/matrix conventions, layer mask and lens/view units.
 * @evidence contracts/performance.md#efficient-algorithms Each capture/restore reads fixed-size lens/vector/matrix state and one temporary camera clone, constant adapter work/storage; camera.clone is recursive by native default, so a camera with children may additionally clone its child subtree despite parentless admission.
 * @evidence contracts/performance.md#reuse-equivalent-work Capture/restore share native lens semantics and one borrowed camera identity; mutable lens/pose/view input requires new snapshots/candidate validation, with no cached custom projection or alternate math.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned closures retain the borrowed camera and each capture transfers copied scalar/array/view state; temporary clones acquire no GPU handle themselves but may retain cloned child references until unreachable. The original camera/children remain host-owned and no task starts.
 */
export function createViewerCameraState(camera: THREE.Camera): {
  capture: () => IViewerCameraStateSnapshot;
  restore: (state: unknown) => void;
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
  const restore: (state: unknown) => void = (state: unknown): void => {
    const owned: THREE.PerspectiveCamera | THREE.OrthographicCamera =
      supported();
    if (
      state === null ||
      typeof state !== "object" ||
      Reflect.get(state, "type") !== owned.type
    )
      throw new Error("Camera transfer changed camera type.");
    const read: (name: string, length: number) => number[] = (
      name: string,
      length: number,
    ): number[] => {
      const value: unknown = Reflect.get(state, name);
      if (
        !Array.isArray(value) ||
        value.length !== length ||
        !value.every(
          (part: unknown): boolean =>
            typeof part === "number" && Number.isFinite(part),
        )
      )
        throw new Error("Camera transfer has no finite " + name + ".");
      return value;
    };
    const position: number[] = read("position", 3),
      quaternion: number[] = read("quaternion", 4);
    const scale: number[] = read("scale", 3),
      up: number[] = read("up", 3),
      projection: number[] = read("projection", 16);
    const determinant: number = new THREE.Matrix4()
      .fromArray(projection)
      .determinant();
    if (
      !(Math.hypot(...quaternion) > 0) ||
      !(Math.hypot(...up) > 0) ||
      scale.some((value: number): boolean => value === 0) ||
      determinant === 0 ||
      !Number.isFinite(determinant)
    )
      throw new Error("Camera transfer has a degenerate pose/projection.");
    const layers: unknown = Reflect.get(state, "layers");
    if (
      typeof layers !== "number" ||
      !Number.isInteger(layers) ||
      layers < -2147483648 ||
      layers > 4294967295
    )
      throw new Error("Camera transfer has no valid layer mask.");
    const lens: unknown = Reflect.get(state, "lens");
    if (lens === null || typeof lens !== "object")
      throw new Error("Camera transfer has no lens.");
    const number: (name: string) => number = (name: string): number => {
      const value: unknown = Reflect.get(lens, name);
      if (typeof value !== "number" || !Number.isFinite(value))
        throw new Error("Camera transfer has no finite " + name + ".");
      return value;
    };
    const candidate: THREE.PerspectiveCamera | THREE.OrthographicCamera =
      owned.clone();
    if (candidate instanceof THREE.PerspectiveCamera) {
      if (Reflect.get(lens, "kind") !== "perspective")
        throw new Error("Camera transfer changed projection type.");
      const [
        fov,
        aspect,
        near,
        far,
        zoom,
        filmGauge,
        filmOffset,
        focus,
      ]: number[] = [
        "fov",
        "aspect",
        "near",
        "far",
        "zoom",
        "filmGauge",
        "filmOffset",
        "focus",
      ].map(number);
      if (
        !(
          fov > 0 &&
          fov < 180 &&
          aspect > 0 &&
          near > 0 &&
          far > near &&
          zoom > 0 &&
          filmGauge > 0 &&
          focus > 0
        )
      )
        throw new Error("Camera transfer lens is invalid.");
      Object.assign(candidate, {
        fov,
        aspect,
        near,
        far,
        zoom,
        filmGauge,
        filmOffset,
        focus,
      });
    } else {
      if (Reflect.get(lens, "kind") !== "orthographic")
        throw new Error("Camera transfer changed projection type.");
      const [left, right, top, bottom, near, far, zoom]: number[] = [
        "left",
        "right",
        "top",
        "bottom",
        "near",
        "far",
        "zoom",
      ].map(number);
      if (
        !(right > left && top > bottom && near >= 0 && far > near && zoom > 0)
      )
        throw new Error("Camera transfer lens is invalid.");
      Object.assign(candidate, { left, right, top, bottom, near, far, zoom });
    }
    const view: unknown = Reflect.get(state, "view");
    if (view !== null) {
      if (typeof view !== "object")
        throw new Error("Camera transfer has no view offset.");
      const enabled: unknown = Reflect.get(view, "enabled");
      const values: number[] = [
        "fullWidth",
        "fullHeight",
        "offsetX",
        "offsetY",
        "width",
        "height",
      ].map((key: string): number => {
        const value: unknown = Reflect.get(view, key);
        if (typeof value !== "number" || !Number.isFinite(value))
          throw new Error("Camera transfer has no finite view " + key + ".");
        return value;
      });
      const [fullWidth, fullHeight, offsetX, offsetY, width, height]: number[] =
        values;
      if (
        typeof enabled !== "boolean" ||
        !(fullWidth > 0 && fullHeight > 0 && width > 0 && height > 0)
      )
        throw new Error("Camera transfer view dimensions are invalid.");
      candidate.setViewOffset(
        fullWidth,
        fullHeight,
        offsetX,
        offsetY,
        width,
        height,
      );
      candidate.view!.enabled = enabled;
    } else candidate.view = null;
    // setViewOffset also writes Perspective.aspect. A later native resize may
    // legitimately have changed that lens while preserving the crop window.
    if (candidate instanceof THREE.PerspectiveCamera)
      candidate.aspect = number("aspect");
    candidate.updateProjectionMatrix();
    if (
      !candidate.projectionMatrix.elements.every(
        (value: number, index: number): boolean => value === projection[index],
      )
    )
      throw new Error(
        "The projection does not match the transferred native lens.",
      );
    candidate.position.fromArray(position);
    candidate.quaternion.fromArray(quaternion);
    candidate.scale.fromArray(scale);
    candidate.up.fromArray(up);
    candidate.layers.mask = layers;
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
