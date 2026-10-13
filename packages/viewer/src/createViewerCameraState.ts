import * as THREE from "three";

/**
 * Transfer detached, auto-updating Perspective/Orthographic cameras through
 * their public native lens/transform API, including film and view offsets.
 * Parented, manual-matrix and custom-projection cameras are explicitly refused:
 * another owner must transfer those relationships rather than guess them.
 * All unknown state is validated before the original camera is mutated.
 */
export function createViewerCameraState(camera: THREE.Camera) {
  const supported = (): THREE.PerspectiveCamera | THREE.OrthographicCamera => {
    if (!(camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera) ||
        camera.parent !== null || !camera.matrixAutoUpdate || !camera.matrixWorldAutoUpdate)
      throw new Error("Camera transfer requires a detached auto-updating Perspective/Orthographic camera.");
    return camera;
  };
  const capture = () => {
    const owned = supported();
    const natural = owned.clone();
    natural.updateProjectionMatrix();
    if (!natural.projectionMatrix.elements.every((value, index) => value === owned.projectionMatrix.elements[index]))
      throw new Error("A custom projection requires its original projection owner.");
    return {
      type: owned.type, position: owned.position.toArray(), quaternion: owned.quaternion.toArray(),
      scale: owned.scale.toArray(), up: owned.up.toArray(), layers: owned.layers.mask,
      projection: owned.projectionMatrix.toArray(), view: owned.view === null ? null : { ...owned.view },
      lens: owned instanceof THREE.PerspectiveCamera ? {
        kind: "perspective", fov: owned.fov, aspect: owned.aspect, near: owned.near,
        far: owned.far, zoom: owned.zoom, filmGauge: owned.filmGauge,
        filmOffset: owned.filmOffset, focus: owned.focus,
      } : {
        kind: "orthographic", left: owned.left, right: owned.right, top: owned.top,
        bottom: owned.bottom, near: owned.near, far: owned.far, zoom: owned.zoom,
      },
    };
  };
  const restore = (state: unknown): void => {
    const owned = supported();
    if (state === null || typeof state !== "object" || Reflect.get(state, "type") !== owned.type)
      throw new Error("Camera transfer changed camera type.");
    const read = (name: string, length: number): number[] => {
      const value: unknown = Reflect.get(state, name);
      if (!Array.isArray(value) || value.length !== length ||
          !value.every((part: unknown) => typeof part === "number" && Number.isFinite(part)))
        throw new Error("Camera transfer has no finite " + name + ".");
      return value;
    };
    const position = read("position", 3), quaternion = read("quaternion", 4);
    const scale = read("scale", 3), up = read("up", 3), projection = read("projection", 16);
    const determinant = new THREE.Matrix4().fromArray(projection).determinant();
    if (!(Math.hypot(...quaternion) > 0) || !(Math.hypot(...up) > 0) ||
        scale.some((value) => value === 0) || determinant === 0 || !Number.isFinite(determinant))
      throw new Error("Camera transfer has a degenerate pose/projection.");
    const layers: unknown = Reflect.get(state, "layers");
    if (typeof layers !== "number" || !Number.isInteger(layers) || layers < -2147483648 || layers > 4294967295)
      throw new Error("Camera transfer has no valid layer mask.");
    const lens: unknown = Reflect.get(state, "lens");
    if (lens === null || typeof lens !== "object") throw new Error("Camera transfer has no lens.");
    const number = (name: string): number => {
      const value: unknown = Reflect.get(lens, name);
      if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Camera transfer has no finite " + name + ".");
      return value;
    };
    const candidate = owned.clone();
    if (candidate instanceof THREE.PerspectiveCamera) {
      if (Reflect.get(lens, "kind") !== "perspective") throw new Error("Camera transfer changed projection type.");
      const [fov, aspect, near, far, zoom, filmGauge, filmOffset, focus] =
        ["fov", "aspect", "near", "far", "zoom", "filmGauge", "filmOffset", "focus"].map(number);
      if (!(fov > 0 && fov < 180 && aspect > 0 && near > 0 && far > near && zoom > 0 && filmGauge > 0 && focus > 0))
        throw new Error("Camera transfer lens is invalid.");
      Object.assign(candidate, { fov, aspect, near, far, zoom, filmGauge, filmOffset, focus });
    } else {
      if (Reflect.get(lens, "kind") !== "orthographic") throw new Error("Camera transfer changed projection type.");
      const [left, right, top, bottom, near, far, zoom] =
        ["left", "right", "top", "bottom", "near", "far", "zoom"].map(number);
      if (!(right > left && top > bottom && near >= 0 && far > near && zoom > 0))
        throw new Error("Camera transfer lens is invalid.");
      Object.assign(candidate, { left, right, top, bottom, near, far, zoom });
    }
    const view: unknown = Reflect.get(state, "view");
    if (view !== null) {
      if (typeof view !== "object") throw new Error("Camera transfer has no view offset.");
      const enabled: unknown = Reflect.get(view, "enabled");
      const values = ["fullWidth", "fullHeight", "offsetX", "offsetY", "width", "height"].map((key) => {
        const value: unknown = Reflect.get(view, key);
        if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Camera transfer has no finite view " + key + ".");
        return value;
      });
      const [fullWidth, fullHeight, offsetX, offsetY, width, height] = values;
      if (typeof enabled !== "boolean" || !(fullWidth > 0 && fullHeight > 0 && width > 0 && height > 0))
        throw new Error("Camera transfer view dimensions are invalid.");
      candidate.setViewOffset(fullWidth, fullHeight, offsetX, offsetY, width, height);
      candidate.view!.enabled = enabled;
    } else candidate.view = null;
    // setViewOffset also writes Perspective.aspect. A later native resize may
    // legitimately have changed that lens while preserving the crop window.
    if (candidate instanceof THREE.PerspectiveCamera) candidate.aspect = number("aspect");
    candidate.updateProjectionMatrix();
    if (!candidate.projectionMatrix.elements.every((value, index) => value === projection[index]))
      throw new Error("The projection does not match the transferred native lens.");
    candidate.position.fromArray(position); candidate.quaternion.fromArray(quaternion);
    candidate.scale.fromArray(scale); candidate.up.fromArray(up); candidate.layers.mask = layers;
    candidate.updateMatrixWorld(true);
    const worldDeterminant = candidate.matrixWorld.determinant();
    if (!candidate.matrixWorld.elements.every(Number.isFinite) || worldDeterminant === 0 || !Number.isFinite(worldDeterminant))
      throw new Error("The transferred camera world transform is degenerate.");
    if (owned instanceof THREE.PerspectiveCamera && candidate instanceof THREE.PerspectiveCamera)
      owned.copy(candidate, false);
    else if (owned instanceof THREE.OrthographicCamera && candidate instanceof THREE.OrthographicCamera)
      owned.copy(candidate, false);
    else throw new Error("The validated camera projection changed type.");
    owned.updateMatrixWorld(true);
  };
  return { capture, restore };
}
