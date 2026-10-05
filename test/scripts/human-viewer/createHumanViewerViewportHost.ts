import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { drawHumanViewerFrame } from "./drawHumanViewerFrame";

/**
 * The host a product viewport is created with: the page's one WebGL renderer
 * behind a facade that keeps each viewport's color, tone and shadow settings
 * of its own, so residents sharing the renderer never see each other's
 * settings. The facade has no animation loop, since captures always finish
 * a frame on demand. `resize` calls the viewport's latest resize observer and
 * `release` disposes the orbit controls the viewport created.
 *
 * @evidence contracts/common.md#principled-implementation Per-viewport renderer settings are applied around each draw instead of shared.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the facade, the controls and the resize observer of one resident.
 * @evidence contracts/common.md#meaningful-documentation States the settings isolation, the missing loop and both operations.
 */
export function createHumanViewerViewportHost(
  canvas: HTMLCanvasElement,
  renderer: THREE.WebGLRenderer,
  loader: THREE.TextureLoader,
) {
  const controls: OrbitControls[] = [];
  let resize = (): void => {};
  const settings = {
    outputColorSpace: THREE.SRGBColorSpace as string,
    toneMapping: THREE.LinearToneMapping as THREE.ToneMapping,
    toneMappingExposure: 1,
    shadowMap: {
      enabled: true,
      type: THREE.PCFShadowMap as THREE.ShadowMapType,
      autoUpdate: false,
      needsUpdate: true,
    },
  };
  const props = {
    canvas,
    pixelRatio: 1,
    renderer: {
      capabilities: renderer.capabilities,
      shadowMap: settings.shadowMap,
      get outputColorSpace() {
        return settings.outputColorSpace;
      },
      set outputColorSpace(value: string) {
        settings.outputColorSpace = value;
      },
      get toneMapping() {
        return settings.toneMapping;
      },
      set toneMapping(value: THREE.ToneMapping) {
        settings.toneMapping = value;
      },
      get toneMappingExposure() {
        return settings.toneMappingExposure;
      },
      set toneMappingExposure(value: number) {
        settings.toneMappingExposure = value;
      },
      setPixelRatio: (ratio: number) => renderer.setPixelRatio(ratio),
      setSize: (width: number, height: number, style: boolean) =>
        renderer.setSize(width, height, style),
      setAnimationLoop: (_callback: () => void) => {},
      render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera) =>
        drawHumanViewerFrame(settings, renderer, () =>
          renderer.render(scene, camera),
        ),
      getContext: () => renderer.getContext(),
    },
    orbit: (camera: THREE.PerspectiveCamera) => {
      const orbit = new OrbitControls(camera, canvas);
      controls.push(orbit);
      return orbit;
    },
    observeResize: (observer: () => void) => { resize = observer; },
    loadTexture: (asset: string) => loader.loadAsync(asset),
  };
  return {
    props,
    resize: (): void => resize(),
    release: (): void => controls.forEach((control) => control.dispose()),
  };
}
