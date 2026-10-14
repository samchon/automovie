import * as THREE from "three";

import { AutoMovieEnvironmentTextureOwnership } from "../AutoMovieEnvironmentTextureOwnership.js";

let flat: THREE.DataTexture | null = null;
/**
 * Cache one flat normal texel so normal overlays have a tangent frame to bend.
 *
 * @evidence contracts/common.md#principled-implementation Creates one linear 1x1 RGBA normal texture using the conventional nearest eight-bit neutral coordinates and registers it as a material wrapper before returning it.
 * @evidence contracts/common.md#clear-and-simple-design One module singleton supplies the tangent-frame prerequisite to overlay materials without per-material identical texel construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 128/128/255 bytes are a conventional quantized normal, not a measurement or exactly representable zero tangent slope; no scene-specific fallback is selected.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies nominal neutral texel, shared material use and module versus renderer disposal ownership.
 * @evidence contracts/performance.md#efficient-algorithms First acquisition allocates four texel bytes and one wrapper; subsequent calls are fixed-time lookup, while each renderer owns its native upload.
 * @evidence contracts/performance.md#reuse-equivalent-work All overlay users share the same fixed immutable texel wrapper; they must not mutate it as if it were a private normal map.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module strongly retains exactly one DataTexture until module/application lifetime ends, with no explicit reset API; material/native renderer disposal belongs to borrowers and ownership registration is weak metadata rather than cleanup.
 */
export const getOverlayFlatNormal: () => THREE.DataTexture =
  (): THREE.DataTexture => {
    if (flat !== null) return flat;
    flat = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
    flat.colorSpace = THREE.NoColorSpace;
    flat.needsUpdate = true;
    AutoMovieEnvironmentTextureOwnership.material(flat);
    return flat;
  };
