import * as THREE from "three";

/**
 * Choose image-lighting decoding from the decoded component type. Eight-bit
 * images are display-referred sRGB; HDR float components carry linear radiance.
 * This is the scene's single decoding decision, shared with storage preflight.
 * The distinct linear environment tag matches Three's LinearSRGBColorSpace,
 * while a material's linear data channel uses NoColorSpace.
 *
 * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-image-based-environment Derives declared image lighting decoding from the actual decoded component representation.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Keeps scene environment decoding and host upload facts on the same decision.
 */
export function readAutoMovieEnvironmentColorSpace(
  texture: THREE.Texture,
): "srgb" | "linear-environment" {
  return texture.type === THREE.UnsignedByteType ? "srgb" : "linear-environment";
}
