import * as THREE from "three";

/**
 * Apply the existing image-lighting decoder convention: UnsignedByteType selects sRGB and every other component type selects linear-environment. This assumes the producer supplied sRGB byte images or supported linear nonbyte output; it does not measure radiance or read image color profiles. The linear environment tag maps to Three's LinearSRGBColorSpace, while a material data channel uses NoColorSpace.
 *
 * @evidence contracts/common.md#principled-implementation Selects sRGB image-light decoding for actual UnsignedByteType and linear-environment for other decoded component types, matching the existing scene binding and storage preflight.
 * @evidence contracts/common.md#clear-and-simple-design One component-driven environment decision remains distinct from a material data channel NoColorSpace and from explicit texture storage format.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function does not inspect radiometric image content or validate every nonbyte component representation; supported decoder output is the premise for treating those components as linear radiance.
 * @evidence contracts/common.md#meaningful-documentation Documents the component-type decoding convention, its producer premise and the separate native linear-environment tag without claiming radiometric or color-profile observation.
 * @evidence contracts/performance.md#efficient-algorithms One type comparison returns a fixed union without image traversal, decoding or allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Current component type is observed on every call; the helper has no memo that can conceal a later texture type change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The texture is borrowed and only a string tag escapes; no decoded image, GPU texture or ownership record is retained.
 */
export function readAutoMovieEnvironmentColorSpace(
  texture: THREE.Texture,
): "srgb" | "linear-environment" {
  return texture.type === THREE.UnsignedByteType
    ? "srgb"
    : "linear-environment";
}
