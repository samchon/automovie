import * as THREE from "three";

import { addHumanPreviewRig } from "./previewRig";
import { createHumanPreviewCamera } from "./previewScene";

/**
 * Own display state independently of numerical evaluation and file encoding.
 * The host supplies browser IO; this stage owns lighting, camera and clay.
 * Publishing swaps scene membership only. The caller owns geometry lifetimes,
 * allowing either disposable imported groups or resident editable buffers.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Presents orbitable facial previews without changing the numerical document.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Separates camera, lighting and display state from computation and export.
 */
export function createHumanPreviewStage(props: {
  canvas: { getBoundingClientRect: () => Pick<DOMRect, "width" | "height"> };
  pixelRatio: number;
  renderer: {
    capabilities: Pick<THREE.WebGLCapabilities, "getMaxAnisotropy">;
    setPixelRatio: (ratio: number) => void;
    outputColorSpace: string;
    toneMapping: THREE.ToneMapping;
    toneMappingExposure: number;
    shadowMap: Pick<THREE.WebGLShadowMap, "enabled" | "type">;
    setSize: (width: number, height: number, updateStyle: boolean) => void;
    setAnimationLoop: (callback: () => void) => void;
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
  };
  observeResize: (callback: () => void) => void;
}) {
  const { renderer, canvas } = props;
  renderer.setPixelRatio(Math.min(props.pixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c252e);
  const shadowLights = addHumanPreviewRig({
    scene,
    renderer,
    scale: 1,
  });
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
  const orbit = props.orbit(camera);
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
    if (active === group) return;
    if (active !== undefined) scene.remove(active);
    active = group;
    scene.add(group);
  };
  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    resizeCamera(rect.width, rect.height);
  };
  props.observeResize(resize);
  resize();
  const render = (): void => {
    orbit.update();
    scene.overrideMaterial = clayEnabled ? clay : null;
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(render);

  return {
    publish,
    fitView,
    cameraView,
    setClay: (enabled: boolean): void => {
      clayEnabled = enabled;
    },
    // A cast-shadow boundary can resemble a crease in the anatomical surface.
    // Toggle only the shadow casters: direct light, materials, geometry and the
    // saved document stay fixed, so the two views isolate that ambiguity.
    // Changing the light's shadow count also refreshes Three's shader variant.
    setShadows: (enabled: boolean): void => {
      for (const light of shadowLights) light.castShadow = enabled;
    },
    finish: () => {
      render();
      renderer.getContext().finish();
    },
    renderer: () => {
      const gl = renderer.getContext(),
        extension = gl.getExtension("WEBGL_debug_renderer_info");
      return gl.getParameter(extension?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER);
    },
  };
}
