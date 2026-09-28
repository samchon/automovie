// @ts-check
import * as THREE from "three";

/** A deterministic sky supplies the incident radiance missing from metallic and
 * dielectric reflections. It is shared by every view, including interiors.
 * This is a lighting field, not a photograph or an image of the building.
 * @param {THREE.WebGLRenderer} renderer */
export function daylight(renderer) {
  const width = 512, height = 256;
  const pixels = new Float32Array(width * height * 4);
  const zenith = new THREE.Color("#98b4d0");
  const horizon = new THREE.Color("#e8e9e2");
  const ground = new THREE.Color("#817b6b");
  const cloud = new THREE.Color("#f7f5ee");
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const elevation = Math.sin(((y + 0.5) / height - 0.5) * Math.PI);
    const azimuth = (x + 0.5) / width * Math.PI * 2;
    const colour = horizon.clone().lerp(elevation >= 0 ? zenith : ground, Math.pow(Math.abs(elevation), 0.45));
    // Broad, continuous cloud bands avoid sharp studio-card reflections.
    const band = Math.exp(-Math.pow((elevation - 0.42 - 0.14 * Math.sin(azimuth * 2)) / 0.17, 2));
    colour.lerp(cloud, 0.55 * band);
    const offset = (y * width + x) * 4;
    pixels[offset] = colour.r; pixels[offset + 1] = colour.g; pixels[offset + 2] = colour.b; pixels[offset + 3] = 1;
  }
  const sky = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType);
  sky.mapping = THREE.EquirectangularReflectionMapping;
  sky.colorSpace = THREE.LinearSRGBColorSpace;
  sky.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromEquirectangular(sky);
  generator.dispose();
  return { sky, environment, dispose: () => { sky.dispose(); environment.dispose(); } };
}
