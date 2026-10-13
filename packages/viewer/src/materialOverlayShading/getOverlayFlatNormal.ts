import * as THREE from "three";
import { AutoMovieEnvironmentTextureOwnership } from "../AutoMovieEnvironmentTextureOwnership.js";


let flat: THREE.DataTexture | null = null;
/**
 * Cache one flat normal texel so normal overlays have a tangent frame to bend.
 */
export const getOverlayFlatNormal = (): THREE.DataTexture => {
  if (flat !== null) return flat;
  flat = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
  flat.colorSpace = THREE.NoColorSpace;
  flat.needsUpdate = true;
  AutoMovieEnvironmentTextureOwnership.material(flat);
  return flat;
};

