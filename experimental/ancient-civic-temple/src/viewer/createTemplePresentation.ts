import * as THREE from "three";
import { createTempleDaylight } from "./createTempleDaylight";

/**
 * Browser GPU boundary for the same preview recipe. Failure propagates to the
 * client; the actual context identity is returned without assuming hardware.
 * @param {HTMLCanvasElement} canvas
 */

export function createTemplePresentation(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.localClippingEnabled = true;
  const gl = renderer.getContext();
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const rendererName = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    : "unverified: WEBGL_debug_renderer_info unavailable";
  const scene = new THREE.Scene();
  const { sky, hemisphere, sun } = createTempleDaylight();
  scene.background = sky;
  scene.environment = sky;
  // Reflected fill reveals shaded bronze without flattening the retained key.
  scene.environmentIntensity = 0.25;
  scene.add(hemisphere, sun, sun.target);
  return { renderer, rendererName, scene };
}
