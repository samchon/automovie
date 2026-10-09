import * as THREE from "three";

/** Preserve the production's existing shadow, clipping and tone-mapping recipe. */
export function configureManorRenderer(renderer: THREE.WebGLRenderer): void {
  renderer.shadowMap.enabled = true;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
}
