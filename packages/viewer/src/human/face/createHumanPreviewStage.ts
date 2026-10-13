import * as THREE from "three";

import { createHumanObservation } from "../common/observation/createHumanObservation.js";
import { addHumanPreviewRig } from "../common/addHumanPreviewRig.js";
import { createHumanPreviewCamera } from "../common/createHumanPreviewCamera.js";
import { createHumanViewportTransfer } from "../common/createHumanViewportTransfer.js";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { publishViewerCompletedFrame } from "../../publishViewerCompletedFrame.js";

/**
 * Own display state independently of numerical evaluation and file encoding.
 * The host supplies browser IO; this stage owns lighting, camera and clay.
 * Publishing swaps scene membership and marks shadows stale. The caller owns
 * geometry lifetimes, allowing disposable or resident editable buffers.
 * Shadows depend on the published geometry, hair finish and caster toggle,
 * not the orbit camera. Refresh their eight maps at those transitions while
 * the static scene renders without repeated shadow submissions between edits.
 * Native orbit change events and owned model/view/pass/resize transitions mark
 * meaningful display changes. Idle draws still publish their exact facts but
 * need no new encoded bitmap. Hosts without native orbit events retain eager
 * observation; an explicit finish always marks a fresh completed display.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Presents orbitable facial previews without changing the numerical document.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Separates camera, lighting and display state from computation and export.
 */
export function createHumanPreviewStage(props: {
  canvas: {
    getBoundingClientRect: () => Pick<DOMRect, "width" | "height">;
    getAttribute?: (name: string) => string | null;
    dispatchEvent?: (event: Event) => boolean;
  };
  pixelRatio: number;
  renderer: {
    capabilities: Pick<THREE.WebGLCapabilities, "getMaxAnisotropy">;
    setPixelRatio: (ratio: number) => void;
    outputColorSpace: string;
    toneMapping: THREE.ToneMapping;
    toneMappingExposure: number;
    shadowMap: Pick<
      THREE.WebGLShadowMap,
      "enabled" | "type" | "autoUpdate" | "needsUpdate"
    >;
    setSize: (width: number, height: number, updateStyle: boolean) => void;
    setAnimationLoop: (callback: (() => void) | null) => void;
    render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void;
    getContext: () => {
      finish: () => void;
      getExtension: (
        name: string,
      ) => { UNMASKED_RENDERER_WEBGL: number } | null;
      getParameter: (parameter: number) => unknown;
      RENDERER: number;
    };
  };
  orbit: (camera: THREE.PerspectiveCamera) => {
    target: THREE.Vector3;
    enableDamping: boolean;
    minDistance: number;
    maxDistance: number;
    update: () => unknown;
    /** Native camera-change notification; absent adapters retain eager saving. */
    addEventListener?: (type: "change", listener: () => void) => void;
  };
  observeResize: (callback: () => void) => void;
}) {
  const { renderer, canvas } = props;
  renderer.setPixelRatio(Math.min(props.pixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.shadowMap.enabled = true;
  // Three r186 maps the removed soft mode to PCF on its first shadow draw.
  // Select that canonical mode before a direct renderer can draw the preview.
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c252e);
  const shadowLights = addHumanPreviewRig({
    scene,
    renderer,
    scale: 1,
  });
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
  const orbit = props.orbit(camera);
  let displayDirty = true;
  const invalidateDisplay = (): void => { displayDirty = true; };
  orbit.addEventListener?.("change", invalidateDisplay);
  orbit.target.set(0, -0.015, 0);
  orbit.enableDamping = true;
  orbit.minDistance = 0.12;
  orbit.maxDistance = 2;
  const clay = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  let active: THREE.Group | undefined;
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
  const publish = (group: THREE.Group): void => {
    invalidateDisplay();
    renderer.shadowMap.needsUpdate = true;
    if (active === group) return;
    if (active !== undefined) scene.remove(active);
    active = group;
    scene.add(group);
  };
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
    () => renderer.setAnimationLoop(null),
    () => observation.close(),
    () => {
      if (active !== undefined) scene.remove(active);
    },
    () => {
      active = undefined;
    },
    () => clay.dispose(),
    ...shadowLights.flatMap((light) => [
      () => light.shadow.map?.dispose(),
      () => light.shadow.mapPass?.dispose(),
    ]),
  ]);

  return {
    /** Await the observation owner's temporary-material retirement outcomes. */
    settleRetirements: () => observation.settleRetirements(),
    /** Retire this stage's loop, scene references and materials without closing its borrowed renderer. */
    close,
    /** Restore display-owned materials before the numerical owner releases a resident. */
    restoreObservation: observation.restore,
    publish,
    fitView: (): void => { invalidateDisplay(); fitView(); },
    cameraView: (degrees: number): void => { invalidateDisplay(); cameraView(degrees); },
    observe: observation.hooks,
    setClay: (enabled: boolean): void => {
      invalidateDisplay();
      clayEnabled = enabled;
      renderer.shadowMap.needsUpdate = true;
    },
    // A cast-shadow boundary can resemble a crease in the anatomical surface.
    // Toggle only the shadow casters: direct light, materials, geometry and the
    // saved document stay fixed, so the two views isolate that ambiguity.
    // Changing the light's shadow count also refreshes Three's shader variant.
    setShadows: (enabled: boolean): void => {
      invalidateDisplay();
      for (const light of shadowLights) light.castShadow = enabled;
      renderer.shadowMap.needsUpdate = true;
    },
    finish,
    renderer: () => {
      const gl = renderer.getContext(),
        extension = gl.getExtension("WEBGL_debug_renderer_info");
      return gl.getParameter(extension?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER);
    },
  };
}
