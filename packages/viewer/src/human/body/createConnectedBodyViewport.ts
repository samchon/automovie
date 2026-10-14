/**
 * The connected body's display stage keeps its metre-scale camera, lights,
 * clay and companion face while publishing resident numerical frames. Worker
 * replies never alter the scene directly; the panel commits a prepared frame
 * and owns the document paired with it. The face shown beside the body remains
 * display only and never enters the body export.
 * The viewport owns static shadow invalidation for publication, observation
 * visibility and pass, caster toggles, and companion membership or placement.
 * Native orbit events and owned display transitions mark meaningful changes;
 * idle draws still publish exact facts without requesting another bitmap.
 * An orbit adapter without change events retains eager saving. Explicit finish
 * and model publication, including reused resident groups, always invalidate.
 */
import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import * as THREE from "three";

import { createHumanObservation } from "../common/observation/createHumanObservation.js";
import { createHumanPreviewCamera } from "../common/createHumanPreviewCamera.js";
import type { IConnectedBodyInspectionLight } from "./IConnectedBodyInspectionLight.js";
import type { IConnectedBodyInspectionLightDirection } from "./IConnectedBodyInspectionLightDirection.js";
import type { IConnectedBodyViewportHost } from "./IConnectedBodyViewportHost.js";
import { createConnectedBodyPreview } from "./createConnectedBodyPreview.js";
import { createConnectedBodyRenderer } from "./createConnectedBodyRenderer.js";
import { createHumanViewportTransfer } from "../common/createHumanViewportTransfer.js";
import { publishViewerCompletedFrame } from "../../publishViewerCompletedFrame.js";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { restoreAutoMovieRenderModeState } from "../../restoreAutoMovieRenderModeState.js";
import { constructAutoMovieOwnedResources } from "../../constructAutoMovieOwnedResources.js";

/**
 * Assemble the body renderer, resident worker and metre-scale display scene.
 *
 * @evidence contracts/common.md#principled-implementation The viewport projects committed numerical frames through one resident renderer into a Y-up metre display with native camera, orbit and authored studio lights. Worker replies remain offscreen until publish; observation and companion changes invalidate owned shadow/display state. Direction changes admit a finite representable nonzero norm before mutation, so overflowing finite vectors still refuse.
 * @evidence contracts/common.md#clear-and-simple-design Display scene, camera, observation and invalidation share one owner; numerical serialization/worker and GPU frame preparation remain separate collaborators. Companion geometry is borrowed display-only membership, while the panel owns the committed document and exports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Studio light powers, colors, clipping distances and shadow bias are existing display conventions, not anatomical measurements or proven matching photographs. No numerical model or exported document is altered by clay, pass, light, camera or companion controls; unobserved current source is not claimed visually correct.
 * @evidence contracts/common.md#meaningful-documentation The comments state metre frame, transaction publication, display-only companion and static invalidation. Close transfers no ownership of the borrowed renderer or orbit controls; the browser factory owns those services and the acquired resident connection is terminated by this viewport.
 * @evidence contracts/performance.md#efficient-algorithms Each animation draw updates orbit/observation and renders native scene work; invalidation avoids requesting duplicate completed-frame images during unchanged native orbit draws. Publication refreshes model buffers through the numerical renderer; construction allocates one fixed studio and shadow configuration, whose actual raster/map cost remains native-renderer work.
 * @evidence contracts/performance.md#reuse-equivalent-work Camera, scene, studio, resident worker and compatible GPU resident persist across edits. Display dirty state changes on actual owned transitions and native orbit events; adapters without events retain eager saving, and finish/publication deliberately invalidate even when group identity is reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Construction immediately registers clay, orbit listener, resize subscription and animation-loop cleanup for rollback. Close memoizes independent cancellation, loop/listener removal, observation/frame/cache/worker and shadow retirement; companion resources and host renderer/controls remain borrowed. Concurrent numerical requests and native raster bytes have no fixed cap in this function.
 */
export function createConnectedBodyViewport<
  Document extends
    | IAutoMovieHumanBodyBasisDocument
    | IAutoMovieHumanPersonDocument = IAutoMovieHumanBodyBasisDocument,
>(props: IConnectedBodyViewportHost<Document>): ReturnType<typeof createConnectedBodyPreview<Document>> & {
  settleRetirements: () => Promise<void>;
  close: () => Promise<void>;
  publish: (model: Awaited<ReturnType<ReturnType<typeof createConnectedBodyPreview<Document>>["build"]>>) => void;
  dispose: (model: Awaited<ReturnType<ReturnType<typeof createConnectedBodyPreview<Document>>["build"]>>) => void;
  fitView: () => void;
  cameraView: (degrees: number) => void;
  observe: ReturnType<typeof createHumanObservation>["hooks"];
  setClay: (enabled: boolean) => void;
  setShadows: (enabled: boolean) => void;
  setLightDirection: (input: IConnectedBodyInspectionLightDirection | null) => void;
  companion: { show: (group: THREE.Group | undefined) => void; place: (matrix: THREE.Matrix4) => void };
  finish: () => void;
  renderer: () => unknown;
} {
  return constructAutoMovieOwnedResources((own: <Resource extends { dispose(): void; }>(resource: Resource) => Resource): ReturnType<typeof createConnectedBodyViewport<Document>> => {
  const { renderer, canvas }: IConnectedBodyViewportHost<Document> = props;
  renderer.setPixelRatio(Math.min(props.pixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  scene.background = new THREE.Color(0x1c252e);
  scene.add(new THREE.HemisphereLight(0xffeee2, 0x526578, 0.5));
  const shadowLights: THREE.DirectionalLight[] = [];
  const directional: Map<string, IConnectedBodyInspectionLight> = new Map<string, IConnectedBodyInspectionLight>();
  for (const [name, x, y, z, power, color] of [
    ["key", -1.5, 1.75, 2.25, 2.3, 0xffe9d8],
    ["fill", 1.75, 0.5, 1.5, 0.85, 0xdaeaff],
    ["rim", 0.5, 1.5, -1.25, 1.6, 0xffffff],
  ] as const) {
    const light: THREE.DirectionalLight = new THREE.DirectionalLight(color, power);
    light.name = name;
    light.position.set(x, y, z);
    directional.set(name, { light, rest: light.position.clone() });
    scene.add(light);
    if (x < 0) {
      shadowLights.push(light);
      light.castShadow = true;
      light.shadow.mapSize.set(4096, 4096);
      Object.assign(light.shadow.camera, {
        left: -1,
        right: 1,
        top: 1,
        bottom: -1,
        near: 0.01,
        far: 10,
      });
      light.shadow.normalBias = 0.004;
      light.shadow.bias = -0.00005;
      light.shadow.camera.updateProjectionMatrix();
    }
  }
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  const orbit: ReturnType<IConnectedBodyViewportHost<Document>["orbit"]> = props.orbit(camera);
  let displayDirty: boolean = true;
  const invalidateDisplay: () => void = (): void => { displayDirty = true; };
  own({ dispose: (): void => orbit.removeEventListener?.("change", invalidateDisplay) });
  orbit.addEventListener?.("change", invalidateDisplay);
  orbit.target.set(0, -0.015, 0);
  orbit.enableDamping = true;
  orbit.minDistance = 0.12;
  orbit.maxDistance = 10;
  const clay: THREE.MeshStandardMaterial = own(new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.75,
    side: THREE.DoubleSide,
  }));
  let active: THREE.Group | undefined;
  let companion: THREE.Group | undefined;
  let clayEnabled: boolean = false;
  const observation: ReturnType<typeof createHumanObservation> = createHumanObservation({
    scene,
    camera,
    orbit,
    roots: (): THREE.Group<THREE.Object3DEventMap>[] => (active === undefined ? [] : [active]),
    clay,
    height: (): number => canvas.getBoundingClientRect().height,
    invalidateShadows: (): void => {
      renderer.shadowMap.needsUpdate = true;
    },
    invalidateDisplay,
  });
  const numerical: ReturnType<typeof createConnectedBodyRenderer> = createConnectedBodyRenderer({
    loadTexture: props.loadTexture,
    maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
  });
  const preview: ReturnType<typeof createConnectedBodyPreview<Document>> = createConnectedBodyPreview<Document>({
    worker: props.worker,
    renderer: numerical,
    serialize: props.serialize,
    source: props.source,
  });
  type Model = Awaited<ReturnType<typeof preview.build>>;
  const {
    cameraView,
    fitView,
    resize: resizeCamera,
  }: { cameraView: (degrees: number) => void; fitView: () => void; resize: (width: number, height: number) => void; } = createHumanPreviewCamera({
    camera,
    orbit,
    model: (): THREE.Group<THREE.Object3DEventMap> | undefined => active,
    setSize: (width: number, height: number): void => renderer.setSize(width, height, false),
  });
  cameraView(0);
  const resize: () => void = (): void => {
    invalidateDisplay();
    const rect: Pick<DOMRect, "width" | "height"> = canvas.getBoundingClientRect();
    resizeCamera(rect.width, rect.height);
  };
  const stopResize: () => void = props.observeResize(resize);
  own({ dispose: stopResize });
  resize();
  let freezes: number = 0;
  const render: () => void = (): void => {
    if (freezes === 0) orbit.update();
    observation.apply();
    scene.overrideMaterial = observation.override(clayEnabled);
    const changed: boolean | undefined = orbit.addEventListener === undefined ? undefined : displayDirty;
    displayDirty = false;
    renderer.render(scene, camera);
    publishViewerCompletedFrame(canvas, { camera, scene,
      pass: observation.hooks.state().pass === "beauty" && clayEnabled ? "clay" : observation.hooks.state().pass,
      control: transfer, requiresApplication: true, changed });
  };
  const finish: () => void = (): void => { invalidateDisplay(); render(); renderer.getContext().finish(); };
  const transfer: ReturnType<typeof createHumanViewportTransfer> = createHumanViewportTransfer({
    camera,
    observe: observation.hooks, clay: (): boolean => clayEnabled,
    shadows: (): boolean => shadowLights.some((light: THREE.DirectionalLight): boolean => light.castShadow),
    setClay: (value: boolean): void => { invalidateDisplay(); clayEnabled = value; renderer.shadowMap.needsUpdate = true; },
    setShadows: (value: boolean): void => { invalidateDisplay(); for (const light of shadowLights) light.castShadow = value; renderer.shadowMap.needsUpdate = true; },
    finish,
    freeze: (): () => void => {
      ++freezes;
      let released: boolean = false;
      return (): void => { if (!released) { released = true; --freezes; } };
    },
  });
  own({ dispose: (): void => renderer.setAnimationLoop(null) });
  renderer.setAnimationLoop(render);
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => preview.cancel(),
    (): void => renderer.setAnimationLoop(null),
    (): void => orbit.removeEventListener?.("change", invalidateDisplay),
    stopResize,
    (): Promise<void> => observation.close(),
    (): void => {
      if (active !== undefined) scene.remove(active);
    },
    (): void => {
      if (companion !== undefined) scene.remove(companion);
    },
    (): void => {
      active = undefined;
    },
    (): void => {
      companion = undefined;
    },
    (): void => clay.dispose(),
    ...shadowLights.flatMap((light: THREE.DirectionalLight): (() => void)[] => [
      (): void => light.shadow.map?.dispose(),
      (): void => light.shadow.mapPass?.dispose(),
    ]),
    (): Promise<void> => numerical.close(),
    (): void => preview.disposeWorker(),
  ]);
  return {
    ...preview,
    /** Await requested frame retirements; cleanup failure does not undo a published document/model pair. */
    settleRetirements: (): Promise<void> => createAutoMovieResourceRetirement([
      (): Promise<void> => observation.settleRetirements(),
      (): Promise<void> => numerical.settleRetirements(),
    ])(),
    /** Retire this stage and resident worker connection; the host retains its renderer and orbit controls. */
    close,
    publish: (model: Model): void => {
      invalidateDisplay();
      observation.restore();
      const group: THREE.Group<THREE.Object3DEventMap> = numerical.publish(model.frame);
      renderer.shadowMap.needsUpdate = true;
      if (active !== group) {
        if (active !== undefined) scene.remove(active);
        active = group;
        scene.add(group);
      }
    },
    dispose: (model: Model): void => {
      invalidateDisplay();
      restoreAutoMovieRenderModeState([
        (): void => observation.restore(),
        (): void => numerical.dispose(model.frame),
      ]);
    },
    fitView: (): void => { invalidateDisplay(); fitView(); },
    cameraView: (degrees: number): void => { invalidateDisplay(); cameraView(degrees); },
    observe: observation.hooks,
    setClay: (enabled: boolean): void => {
      invalidateDisplay();
      clayEnabled = enabled;
      renderer.shadowMap.needsUpdate = true;
    },
    setShadows: (enabled: boolean): void => {
      invalidateDisplay();
      for (const light of shadowLights) light.castShadow = enabled;
      renderer.shadowMap.needsUpdate = true;
    },
    /**
     * Change one named inspection light's direction while retaining its
     * original distance, colour, intensity and caster policy. All three lights
     * target the world origin. The dimensionless direction points from that
     * origin toward the light in the displayed Y-up, Z-forward frame.
     * Each call restores the other lights; null restores the whole studio.
     * Unknown names and nonfinite or zero norms refuse before any mutation.
     * Component scaling keeps normalization ratios representable after the
     * finite, nonzero norm gate. A finite vector whose norm overflows still
     * refuses before that scaling; current controls supply bounded directions.
     * This affects
     * display only, never the numerical model, document or exported bytes.
     */
    setLightDirection: (
      input: IConnectedBodyInspectionLightDirection | null,
    ): void => {
      const selected: IConnectedBodyInspectionLight | null | undefined = input === null ? null : directional.get(input.name);
      if (selected === undefined)
        throw new Error("Unknown inspection light: " + input!.name);
      const magnitude: number = input === null ? 1 : Math.hypot(...input.direction);
      if (!Number.isFinite(magnitude) || magnitude === 0)
        throw new Error(
          "An inspection light needs a finite nonzero direction.",
        );
      let changed: boolean = false;
      for (const one of directional.values()) {
        const goal: THREE.Vector3 = one.rest.clone();
        if (input !== null && one === selected) {
          const distance: number = one.rest.length();
          const scale: number = Math.max(...input.direction.map(Math.abs));
          const norm: number = Math.hypot(...input.direction.map((x: number): number => x / scale));
          goal.set(
            (input.direction[0] / scale / norm) * distance,
            (input.direction[1] / scale / norm) * distance,
            (input.direction[2] / scale / norm) * distance,
          );
        }
        if (!one.light.position.equals(goal)) {
          one.light.position.copy(goal);
          changed = true;
        }
      }
      if (changed) { invalidateDisplay(); renderer.shadowMap.needsUpdate = true; }
    },
    companion: {
      show: (group: THREE.Group | undefined): void => {
        invalidateDisplay();
        if (companion !== undefined) scene.remove(companion);
        companion = group;
        if (group !== undefined) scene.add(group);
        renderer.shadowMap.needsUpdate = true;
      },
      place: (matrix: THREE.Matrix4): void => {
        if (companion === undefined) return;
        invalidateDisplay();
        companion.matrixAutoUpdate = false;
        companion.matrix.copy(matrix);
        companion.matrixWorldNeedsUpdate = true;
        renderer.shadowMap.needsUpdate = true;
      },
    },
    finish,
    renderer: (): unknown => {
      const gl: { finish: () => void; getExtension: (name: string) => { UNMASKED_RENDERER_WEBGL: number; } | null; getParameter: (parameter: number) => unknown; RENDERER: number; } = renderer.getContext();
      const extension: { UNMASKED_RENDERER_WEBGL: number; } | null = gl.getExtension("WEBGL_debug_renderer_info");
      return gl.getParameter(extension?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER);
    },
  };
  });
}
