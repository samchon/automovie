import * as THREE from "three";

/**
 * Read supported R16F, RG16F and RGBA storage from the actual upload declaration. An explicit internal format owns storage width; otherwise format and component type identifies it. Unsupported formats stay unknown rather than becoming an assumed four-byte texel. This does not certify dimensions or allocation.
 *
 * @evidence contracts/common.md#principled-implementation Maps supported explicit R16F/RG16F/RGBA storage first, otherwise uses actual format/component type to report the corresponding upload representation.
 * @evidence contracts/common.md#clear-and-simple-design One shared representation decoder serves source and target profiles without decoding images or mixing authored sampler semantics into native storage width.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown explicit format, unsupported channel layout and unsupported component remain undefined rather than assumed RGBA8; this is a declaration profile, not dimension or upload proof.
 * @evidence contracts/common.md#meaningful-documentation Documents explicit-format priority, supported native layouts and the separate extent/allocation obligations.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of format/type comparisons return one fixed union with no texel or attachment traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Current declared representation is observed afresh; no stale profile survives a mutable texture format/type change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The texture stays borrowed and only a string or undefined escapes; no image, native texture or retention record is acquired.
 */
export function readAutoMovieTextureUploadFormat(
  texture: THREE.Texture,
): "r16f" | "rgba8" | "rg16f" | "rgba16f" | "rgba32f" | undefined {
  return texture.internalFormat === "RGBA32F"
    ? "rgba32f"
    : texture.internalFormat === "RGBA16F"
      ? "rgba16f"
      : texture.internalFormat === "R16F"
        ? "r16f"
        : texture.internalFormat === "RG16F"
          ? "rg16f"
          : texture.internalFormat === "RGBA8" ||
              texture.internalFormat === "SRGB8_ALPHA8"
            ? "rgba8"
            : texture.internalFormat !== null
              ? undefined
              : texture.format === THREE.RedFormat &&
                  texture.type === THREE.HalfFloatType
                ? "r16f"
                : texture.format === THREE.RGFormat &&
                    texture.type === THREE.HalfFloatType
                  ? "rg16f"
                  : texture.format !== THREE.RGBAFormat
                    ? undefined
                    : texture.type === THREE.UnsignedByteType
                      ? "rgba8"
                      : texture.type === THREE.HalfFloatType
                        ? "rgba16f"
                        : texture.type === THREE.FloatType
                          ? "rgba32f"
                          : undefined;
}
