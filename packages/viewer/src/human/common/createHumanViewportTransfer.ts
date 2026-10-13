import type { createHumanObservation } from "./observation/createHumanObservation.js";
import type * as THREE from "three";
import { createViewerCameraState } from "../../createViewerCameraState.js";

/**
 * Transfer only the actual viewport-owned camera and display state. Numerical
 * documents belong to the application transaction and are restored separately.
 * Every field is validated before the candidate viewport is changed.
 */
export function createHumanViewportTransfer(props: {
  camera: THREE.PerspectiveCamera;
  observe: ReturnType<typeof createHumanObservation>["hooks"];
  clay: () => boolean;
  shadows: () => boolean;
  setClay: (value: boolean) => void;
  setShadows: (value: boolean) => void;
  /** Finish the same owning viewport after restoring its display state. */
  finish: () => void;
  /** Suspend the viewport's own orbit updates until the returned release runs. */
  freeze: () => () => void;
}) {
  const nativeCamera = createViewerCameraState(props.camera);
  return {
    redraw: props.finish,
    freeze: props.freeze,
    capture: () => ({ camera: props.observe.camera(), view: props.observe.state(),
      nativeCamera: nativeCamera.capture(), clay: props.clay(), shadows: props.shadows() }),
    restore: (state: unknown): void => {
      if (state === null || typeof state !== "object") throw new Error("Viewport transfer is not an object.");
      const camera: unknown = Reflect.get(state, "camera");
      const view: unknown = Reflect.get(state, "view");
      if (camera === null || typeof camera !== "object" || view === null || typeof view !== "object")
        throw new Error("Viewport transfer has no observed camera/view.");
      const vector = (name: string): [number, number, number] => {
        const value: unknown = Reflect.get(camera, name);
        if (!Array.isArray(value) || value.length !== 3 || !value.every((part: unknown) => typeof part === "number" && Number.isFinite(part)))
          throw new Error("Viewport transfer has no finite " + name + ".");
        return [value[0], value[1], value[2]];
      };
      const position = vector("position");
      const target = vector("target");
      const fov: unknown = Reflect.get(camera, "fov");
      const pass: unknown = Reflect.get(view, "pass");
      const isolated: unknown = Reflect.get(view, "isolated");
      const hidden: unknown = Reflect.get(view, "hidden");
      const clay: unknown = Reflect.get(state, "clay");
      const shadows: unknown = Reflect.get(state, "shadows");
      const names = (value: unknown): value is string[] => Array.isArray(value) && value.every((part: unknown) => typeof part === "string");
      if (typeof fov !== "number" || !Number.isFinite(fov) || fov <= 0 || fov >= 180 ||
          typeof clay !== "boolean" || typeof shadows !== "boolean" || !names(hidden) ||
          !(isolated === null || names(isolated)) ||
          (pass !== "beauty" && pass !== "clay" && pass !== "normal" && pass !== "depth" &&
           pass !== "flat" && pass !== "albedo" && pass !== "wire" && pass !== "outline"))
        throw new Error("Viewport transfer has invalid display state.");
      if (position.every((value, index) => value === target[index]))
        throw new Error("Viewport transfer has no eye-to-target direction.");
      const parts = new Set(props.observe.parts());
      if ([...hidden, ...(isolated ?? [])].some((name) => !parts.has(name)))
        throw new Error("Viewport transfer names a part unavailable in the candidate.");
      nativeCamera.restore(Reflect.get(state, "nativeCamera"));
      props.observe.look({ position, target, fov });
      // Synchronize OrbitControls first, then preserve the captured native pose
      // exactly while the owning viewport's updates are frozen.
      nativeCamera.restore(Reflect.get(state, "nativeCamera"));
      props.observe.pass(pass);
      props.observe.isolate(isolated);
      props.observe.hide(hidden);
      props.setClay(clay);
      props.setShadows(shadows);
      props.finish();
    },
  };
}
