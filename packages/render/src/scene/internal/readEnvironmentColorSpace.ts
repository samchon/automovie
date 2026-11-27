import * as THREE from "three";

/*
 * Apply the existing image-lighting decoder convention: UnsignedByteType
 * selects sRGB and every other component type selects linear-environment. This
 * assumes the producer supplied sRGB byte images or supported linear nonbyte
 * output; it does not measure radiance or read image color profiles. The linear
 * environment tag maps to Three's LinearSRGBColorSpace, while a material data
 * channel uses NoColorSpace.
 */
export function readEnvironmentColorSpace(
  texture: THREE.Texture,
): "srgb" | "linear-environment" {
  return texture.type === THREE.UnsignedByteType
    ? "srgb"
    : "linear-environment";
}
