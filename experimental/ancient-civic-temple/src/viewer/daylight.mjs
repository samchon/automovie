// @ts-check
/**
 * Fixed dry-day presentation from settings/40-environment#daylight. The live
 * client uses this one light recipe for every room and exterior. The latitude
 * gradient supplies reflected sky radiance to physical materials as well as
 * the visible background; diffuse hemisphere lighting alone gives shaded
 * metals no reflected source and hides their actual colour and roughness.
 * This is a preview environment, not a light-transport or interior GI solver.
 */
import * as THREE from "three";

/** Shared sky, diffuse fill and shadow-casting 45-degree sun. */
export function createTempleDaylight() {
  // Equirectangular V=0 is the lower hemisphere; V=1 is the zenith. Values
  // are sRGB bytes, with the same three colour stops as the former backdrop.
  const stops = [
    [0, 0xe6, 0xe2, 0xd6],
    [0.45, 0xbc, 0xd3, 0xe8],
    [1, 0x7f, 0xa7, 0xcf],
  ];
  // A 2:1 raster is required by THREE's PMREM conversion. The old 2-pixel
  // backdrop stripe had no longitude and cannot be used as an environment.
  const pixels = new Uint8Array(512 * 256 * 4);
  for (let y = 0; y < 256; y++) {
    const latitude = y / 255;
    const [low, high] = latitude <= 0.45
      ? [stops[0], stops[1]]
      : [stops[1], stops[2]];
    const fraction = (latitude - low[0]) / (high[0] - low[0]);
    for (let x = 0; x < 512; x++) {
      const offset = 4 * (y * 512 + x);
      for (let channel = 1; channel <= 3; channel++)
        pixels[offset + channel - 1] = Math.round(low[channel] + fraction * (high[channel] - low[channel]));
      pixels[offset + 3] = 255;
    }
  }
  const sky = new THREE.DataTexture(pixels, 512, 256, THREE.RGBAFormat);
  sky.colorSpace = THREE.SRGBColorSpace;
  sky.mapping = THREE.EquirectangularReflectionMapping;
  sky.magFilter = THREE.LinearFilter;
  sky.minFilter = THREE.LinearFilter;
  sky.needsUpdate = true;
  const hemisphere = new THREE.HemisphereLight(0xe3ecf7, 0x9c8a6c, 1.15);
  const sun = new THREE.DirectionalLight(0xfff1dc, 3.1);
  sun.position.set(-0.5, Math.SQRT1_2, 0.5).normalize().multiplyScalar(45);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, {
    left: -26,
    right: 26,
    top: 26,
    bottom: -26,
    near: 1,
    far: 120,
  });
  // Sub-millimetre offsets retain the existing wall/floor contact shadows.
  sun.shadow.bias = -0.000005;
  sun.shadow.normalBias = 0.0005;
  return { sky, hemisphere, sun };
}

/**
 * Browser GPU boundary for the same preview recipe. Failure propagates to the
 * client; the actual context identity is returned without assuming hardware.
 * @param {HTMLCanvasElement} canvas
 */
export function createTemplePresentation(canvas) {
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
    : "unverified: WEBGL_debug_renderer_info 없음";
  const scene = new THREE.Scene();
  const { sky, hemisphere, sun } = createTempleDaylight();
  scene.background = sky;
  scene.environment = sky;
  // Reflected fill reveals shaded bronze without flattening the retained key.
  scene.environmentIntensity = 0.25;
  scene.add(hemisphere, sun, sun.target);
  return { renderer, rendererName, scene };
}
