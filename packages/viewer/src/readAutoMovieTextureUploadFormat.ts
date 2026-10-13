import * as THREE from "three";

/**
 * Read supported R16F, RG16F and RGBA storage from the actual upload declaration.
 * An explicit internal format owns storage width; otherwise format and component
 * type identifies it. Unsupported formats stay unknown rather than becoming
 * an assumed four-byte texel. This does not certify dimensions or allocation.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies one representation owner shared by decoded sources and target attachments.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Preserves unsupported storage width for source and framebuffer refusal.
 */
export function readAutoMovieTextureUploadFormat(texture: THREE.Texture): "r16f" | "rgba8" | "rg16f" | "rgba16f" | "rgba32f" | undefined {
  return texture.internalFormat === "RGBA32F" ? "rgba32f" :
    texture.internalFormat === "RGBA16F" ? "rgba16f" :
    texture.internalFormat === "R16F" ? "r16f" :
    texture.internalFormat === "RG16F" ? "rg16f" :
    texture.internalFormat === "RGBA8" || texture.internalFormat === "SRGB8_ALPHA8" ? "rgba8" :
    texture.internalFormat !== null ? undefined :
    texture.format === THREE.RedFormat && texture.type === THREE.HalfFloatType ? "r16f" :
    texture.format === THREE.RGFormat && texture.type === THREE.HalfFloatType ? "rg16f" :
    texture.format !== THREE.RGBAFormat ? undefined :
    texture.type === THREE.UnsignedByteType ? "rgba8" :
    texture.type === THREE.HalfFloatType ? "rgba16f" :
    texture.type === THREE.FloatType ? "rgba32f" : undefined;
}
