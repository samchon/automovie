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

/**
 * Assemble the body renderer, resident worker and metre-scale display scene.
 */
export function createConnectedBodyViewport<
  Document extends
    | IAutoMovieHumanBodyBasisDocument
    | IAutoMovieHumanPersonDocument = IAutoMovieHumanBodyBasisDocument,
>(props: IConnectedBodyViewportHost<Document>) {
  const { renderer, canvas } = props;
  renderer.setPixelRatio(Math.min(props.pixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c252e);
  scene.add(new THREE.HemisphereLight(0xffeee2, 0x526578, 0.5));
  const shadowLights: THREE.DirectionalLight[] = [];
  const directional = new Map<string, IConnectedBodyInspectionLight>();
  for (const [name, x, y, z, power, color] of [
    ["key", -1.5, 1.75, 2.25, 2.3, 0xffe9d8],
    ["fill", 1.75, 0.5, 1.5, 0.85, 0xdaeaff],
    ["rim", 0.5, 1.5, -1.25, 1.6, 0xffffff],
  ] as const) {
    const light = new THREE.DirectionalLight(color, power);
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
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  const orbit = props.orbit(camera);
  let displayDirty = true;
  const invalidateDisplay = (): void => { displayDirty = true; };
  orbit.addEventListener?.("change", invalidateDisplay);
  orbit.target.set(0, -0.015, 0);
  orbit.enableDamping = true;
  orbit.minDistance = 0.12;
  orbit.maxDistance = 10;
  const clay = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  let active: THREE.Group | undefined;
  let companion: THREE.Group | undefined;
  let clayEnabled = false;
  const observation = createHumanObservation({
    scene,
    camera,
    orbit,
    roots: () => (active === undefined ? [] : [active]),
    clay,
    height: () => canvas.getBoundingClientRect().height,
    invalidateShadows: () => {
      renderer.shadowMap.needsUpdate = true;
    },
    invalidateDisplay,
  });
  const numerical = createConnectedBodyRenderer({
    loadTexture: props.loadTexture,
    maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
  });
  const preview = createConnectedBodyPreview<Document>({
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
  } = createHumanPreviewCamera({
    camera,
    orbit,
    model: () => active,
    setSize: (width, height) => renderer.setSize(width, height, false),
  });
  cameraView(0);
  const resize = (): void => {
    invalidateDisplay();
    const rect = canvas.getBoundingClientRect();
    resizeCamera(rect.width, rect.height);
  };
  props.observeResize(resize);
  resize();
  let freezes = 0;
  const render = (): void => {
    if (freezes === 0) orbit.update();
    observation.apply();
    scene.overrideMaterial = observation.override(clayEnabled);
    const changed = orbit.addEventListener === undefined ? undefined : displayDirty;
    displayDirty = false;
    renderer.render(scene, camera);
    publishViewerCompletedFrame(canvas, { camera, scene,
      pass: observation.hooks.state().pass === "beauty" && clayEnabled ? "clay" : observation.hooks.state().pass,
      control: transfer, requiresApplication: true, changed });
  };
  const finish = (): void => { invalidateDisplay(); render(); renderer.getContext().finish(); };
  const transfer = createHumanViewportTransfer({
    camera,
    observe: observation.hooks, clay: () => clayEnabled,
    shadows: () => shadowLights.some((light) => light.castShadow),
    setClay: (value) => { invalidateDisplay(); clayEnabled = value; renderer.shadowMap.needsUpdate = true; },
    setShadows: (value) => { invalidateDisplay(); for (const light of shadowLights) light.castShadow = value; renderer.shadowMap.needsUpdate = true; },
    finish,
    freeze: () => {
      ++freezes;
      let released = false;
      return () => { if (!released) { released = true; --freezes; } };
    },
  });
  renderer.setAnimationLoop(render);
  const close = createAutoMovieResourceRetirement([
    () => preview.cancel(),
    () => renderer.setAnimationLoop(null),
    () => observation.close(),
    () => {
      if (active !== undefined) scene.remove(active);
    },
    () => {
      if (companion !== undefined) scene.remove(companion);
    },
    () => {
      active = undefined;
    },
    () => {
      companion = undefined;
    },
    () => clay.dispose(),
    ...shadowLights.flatMap((light) => [
      () => light.shadow.map?.dispose(),
      () => light.shadow.mapPass?.dispose(),
    ]),
    () => numerical.close(),
  ]);
  return {
    ...preview,
    /** Await requested frame retirements; cleanup failure does not undo a published document/model pair. */
    settleRetirements: () => createAutoMovieResourceRetirement([
      () => observation.settleRetirements(),
      () => numerical.settleRetirements(),
    ])(),
    /** Retire this stage's resources without disposing its borrowed renderer or worker connection. */
    close,
    publish: (model: Model): void => {
      invalidateDisplay();
      observation.restore();
      const group = numerical.publish(model.frame);
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
        () => observation.restore(),
        () => numerical.dispose(model.frame),
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
     * Scaling by the largest component before normalization also keeps
     * finite subnormal and very large directions representable. This affects
     * display only, never the numerical model, document or exported bytes.
     */
    setLightDirection: (
      input: IConnectedBodyInspectionLightDirection | null,
    ): void => {
      const selected = input === null ? null : directional.get(input.name);
      if (selected === undefined)
        throw new Error("Unknown inspection light: " + input!.name);
      const magnitude = input === null ? 1 : Math.hypot(...input.direction);
      if (!Number.isFinite(magnitude) || magnitude === 0)
        throw new Error(
          "An inspection light needs a finite nonzero direction.",
        );
      let changed = false;
      for (const one of directional.values()) {
        const goal = one.rest.clone();
        if (input !== null && one === selected) {
          const distance = one.rest.length();
          const scale = Math.max(...input.direction.map(Math.abs));
          const norm = Math.hypot(...input.direction.map((x) => x / scale));
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
    renderer: () => {
      const gl = renderer.getContext();
      const extension = gl.getExtension("WEBGL_debug_renderer_info");
      return gl.getParameter(extension?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER);
    },
  };
}
