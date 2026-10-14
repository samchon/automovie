import * as THREE from "three";

/**
 * Choose image-lighting decoding from the decoded component type. Eight-bit images are display-referred sRGB; HDR float components carry linear radiance. This is the scene's single decoding decision, shared with storage preflight. The distinct linear environment tag matches Three's LinearSRGBColorSpace, while a material's linear data channel uses NoColorSpace.
 *
 * @evidence contracts/common.md#principled-implementation Selects sRGB image-light decoding for actual UnsignedByteType and linear-environment for other decoded component types, matching the existing scene binding and storage preflight.
 * @evidence contracts/common.md#clear-and-simple-design One component-driven environment decision remains distinct from a material data channel NoColorSpace and from explicit texture storage format.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function does not inspect radiometric image content or validate every nonbyte component representation; supported decoder output is the premise for treating those components as linear radiance.
 * @evidence contracts/common.md#meaningful-documentation Documents display-referred byte images, linear HDR components and the separate native linear-environment tag.
 * @evidence contracts/performance.md#efficient-algorithms One type comparison returns a fixed union without image traversal, decoding or allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Current component type is observed on every call; the helper has no memo that can conceal a later texture type change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The texture is borrowed and only a string tag escapes; no decoded image, GPU texture or ownership record is retained.
 */
export function readAutoMovieEnvironmentColorSpace(
  texture: THREE.Texture,
): "srgb" | "linear-environment" {
  return texture.type === THREE.UnsignedByteType ? "srgb" : "linear-environment";
}
