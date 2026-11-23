import * as THREE from "three";

import { AutoMovieEnvironmentTextureOwnership } from "../AutoMovieEnvironmentTextureOwnership.js";
import { SUBSURFACE_TEXTURE_SIZE } from "./SUBSURFACE_TEXTURE_SIZE.js";
import { subsurfaceTable } from "./subsurfaceTable.js";

const { cosines: COSINES, blurs: BLURS }: typeof SUBSURFACE_TEXTURE_SIZE =
  SUBSURFACE_TEXTURE_SIZE;

let shared: THREE.DataTexture | null = null;
/**
 * Return the module-shared 64-by-32 red half-float subsurface lookup wrapper.
 * Consumers borrow its immutable sampling/content state; module retention has
 * no explicit final disposal boundary.
 */
export function getSubsurfaceTexture(): THREE.DataTexture {
  if (shared !== null) return shared;
  const table: number[][] = subsurfaceTable();
  const data: Uint16Array = new Uint16Array(COSINES * BLURS);
  table.forEach((row: number[], j: number): void =>
    row.forEach((value: number, i: number): void => {
      data[j * COSINES + i] = THREE.DataUtils.toHalfFloat(value);
    }),
  );
  const texture: THREE.DataTexture = new THREE.DataTexture(
    data,
    COSINES,
    BLURS,
    THREE.RedFormat,
    THREE.HalfFloatType,
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  AutoMovieEnvironmentTextureOwnership.material(texture);
  shared = texture;
  return texture;
}
