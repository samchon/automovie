import * as THREE from "three";

/**
 * Choose image-lighting decoding from the decoded component type. Eight-bit
 * images are display-referred sRGB; HDR float components carry linear radiance.
 * This is the scene's single decoding decision, shared with storage preflight.
 * The distinct linear environment tag matches Three's LinearSRGBColorSpace,
 * while a material's linear data channel uses NoColorSpace.
 */
export function readAutoMovieEnvironmentColorSpace(
  texture: THREE.Texture,
): "srgb" | "linear-environment" {
  return texture.type === THREE.UnsignedByteType ? "srgb" : "linear-environment";
}
