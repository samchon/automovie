import type { createHumanObservation } from "./observation/createHumanObservation.js";
import type * as THREE from "three";
import { createViewerCameraState } from "../../createViewerCameraState.js";
import type { IViewerCameraStateSnapshot } from "../../IViewerCameraStateSnapshot.js";
import type { HumanObservationPass } from "./observation/HumanObservationPass.js";

/**
 * Transfer only the actual viewport-owned camera and display state. Numerical
 * documents belong to the application transaction and are restored separately.
 * Display fields and part names are admitted before changing the candidate;
 * native camera restoration admits its own lens/pose before copying it.
 * Custom host callbacks can still fail after an earlier mutation.
 *
 * @evidence contracts/common.md#principled-implementation Captures observed camera/pass/selection plus the actual native camera, clay and shadow flags. Restore checks finite vectors, supported pass, known part names and lens/pose through createViewerCameraState before assigning display state; native restoration is repeated after orbit look to preserve the captured pose while updates are frozen.
 * @evidence contracts/common.md#clear-and-simple-design One viewport-owned transfer carries display state only, leaving numerical document transaction admission to the application. Existing redraw and freeze ports stay with the actual stage rather than introducing a second host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown selections and unsupported pass values refuse rather than being silently dropped. The two camera records are not cross-validated for mutual consistency, and custom setter/render failures can leave partial mutation; this is not a general atomic transaction promise.
 * @evidence contracts/common.md#meaningful-documentation The comment states display-only ownership, separate numerical document restoration and the callback failure limit. Finish and freeze members explain draw ownership and the returned idempotent release responsibility supplied by the host.
 * @evidence contracts/performance.md#efficient-algorithms Capture copies fixed camera/scalar state plus selection arrays. Restore validates H hidden and I isolated names using a set of P actual parts, linear in P+H+I, plus the native camera admission cost and host redraw.
 * @evidence contracts/performance.md#reuse-equivalent-work Both native restore calls use the same captured state around the effectful orbit synchronization. The owner borrows actual live hooks rather than caching a display snapshot by document identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Closures retain borrowed viewport services and capture returns copied display payloads. Freeze lifetime belongs to the caller until its returned release runs; this helper creates no worker, renderer or native resource and does not close the host.
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
}): { redraw: () => void; freeze: () => () => void; capture: () => { camera: { position: THREE.Vector3Tuple; target: THREE.Vector3Tuple; fov: number; near: number; far: number; aspect: number; }; view: { pass: HumanObservationPass; isolated: string[] | null; hidden: string[]; }; nativeCamera: IViewerCameraStateSnapshot; clay: boolean; shadows: boolean; }; restore: (state: unknown) => void; } {
  const nativeCamera: { capture: () => IViewerCameraStateSnapshot; restore: (state: unknown) => void; } = createViewerCameraState(props.camera);
  return {
    redraw: props.finish,
    freeze: props.freeze,
    capture: (): { camera: { position: THREE.Vector3Tuple; target: THREE.Vector3Tuple; fov: number; near: number; far: number; aspect: number; }; view: { pass: HumanObservationPass; isolated: string[] | null; hidden: string[]; }; nativeCamera: IViewerCameraStateSnapshot; clay: boolean; shadows: boolean; } => ({ camera: props.observe.camera(), view: props.observe.state(),
      nativeCamera: nativeCamera.capture(), clay: props.clay(), shadows: props.shadows() }),
    restore: (state: unknown): void => {
      if (state === null || typeof state !== "object") throw new Error("Viewport transfer is not an object.");
      const camera: unknown = Reflect.get(state, "camera");
      const view: unknown = Reflect.get(state, "view");
      if (camera === null || typeof camera !== "object" || view === null || typeof view !== "object")
        throw new Error("Viewport transfer has no observed camera/view.");
      const vector: (name: string) => [number, number, number] = (name: string): [number, number, number] => {
        const value: unknown = Reflect.get(camera, name);
        if (!Array.isArray(value) || value.length !== 3 || !value.every((part: unknown): boolean => typeof part === "number" && Number.isFinite(part)))
          throw new Error("Viewport transfer has no finite " + name + ".");
        return [value[0], value[1], value[2]];
      };
      const position: [number, number, number] = vector("position");
      const target: [number, number, number] = vector("target");
      const fov: unknown = Reflect.get(camera, "fov");
      const pass: unknown = Reflect.get(view, "pass");
      const isolated: unknown = Reflect.get(view, "isolated");
      const hidden: unknown = Reflect.get(view, "hidden");
      const clay: unknown = Reflect.get(state, "clay");
      const shadows: unknown = Reflect.get(state, "shadows");
      const names: (value: unknown) => value is string[] = (value: unknown): value is string[] => Array.isArray(value) && value.every((part: unknown): boolean => typeof part === "string");
      if (typeof fov !== "number" || !Number.isFinite(fov) || fov <= 0 || fov >= 180 ||
          typeof clay !== "boolean" || typeof shadows !== "boolean" || !names(hidden) ||
          !(isolated === null || names(isolated)) ||
          (pass !== "beauty" && pass !== "clay" && pass !== "normal" && pass !== "depth" &&
           pass !== "flat" && pass !== "albedo" && pass !== "wire" && pass !== "outline"))
        throw new Error("Viewport transfer has invalid display state.");
      if (position.every((value: number, index: number): boolean => value === target[index]))
        throw new Error("Viewport transfer has no eye-to-target direction.");
      const parts: Set<string> = new Set(props.observe.parts());
      if ([...hidden, ...(isolated ?? [])].some((name: string): boolean => !parts.has(name)))
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
