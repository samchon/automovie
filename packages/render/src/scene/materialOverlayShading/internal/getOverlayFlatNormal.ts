import * as THREE from "three";

/*
 * The one flat normal texel, made when the module loads.
 */
const FLAT: THREE.DataTexture = ((): THREE.DataTexture => {
  const texture: THREE.DataTexture = new THREE.DataTexture(
    new Uint8Array([128, 128, 255, 255]),
    1,
    1,
  );
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
})();

/*
 * The module's one flat normal texel, so normal overlays have a tangent frame
 * to bend.
 * Returns: The shared texture; consumers borrow it and never dispose it.
 */
export const getOverlayFlatNormal: () => THREE.DataTexture =
  (): THREE.DataTexture => FLAT;
