import * as THREE from "three";
import { AutoMovieEnvironmentTextureOwnership } from "../AutoMovieEnvironmentTextureOwnership.js";
import { subsurfaceTable } from "./subsurfaceTable.js";
import { SUBSURFACE_TEXTURE_SIZE } from "./SUBSURFACE_TEXTURE_SIZE.js";
const { cosines: COSINES, blurs: BLURS } = SUBSURFACE_TEXTURE_SIZE;

let shared: THREE.DataTexture | null = null;
/**
 * Cache the actual half-float lookup across material consumers. Its shared
 * shader role prevents an environment handoff from retiring the same wrapper.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Creates the shared material lookup whose actual texture facts supply its retained byte bound.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps one lookup object across material consumers and separate from material disposal.
 */
export const getSubsurfaceTexture = (): THREE.DataTexture => {
  if (shared !== null) return shared;
  const table = subsurfaceTable();
  const data = new Uint16Array(COSINES * BLURS);
  table.forEach((row, j) =>
    row.forEach((value, i) => {
      data[j * COSINES + i] = THREE.DataUtils.toHalfFloat(value);
    }),
  );
  const texture = new THREE.DataTexture(
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
};


