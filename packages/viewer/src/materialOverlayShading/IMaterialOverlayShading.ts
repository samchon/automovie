import * as THREE from "three";

/**
 * One overlay with its images decoded.
 *
 * @evidence contracts/common.md#principled-implementation Represents decoded overlay textures separately from blend, linear colour factors, optional roughness/normal and their dimensionless scales.
 * @evidence contracts/common.md#clear-and-simple-design The interface supplies exactly material composition inputs while texture decoding/cache ownership and shader source generation retain their own owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Strength and scales preserve application-admitted parameters; the type itself is not runtime range validation or a physical tissue acceptance verdict.
 * @evidence contracts/common.md#meaningful-documentation Members document sRGB/alpha versus linear factors, multiply/replace meaning and null keeping existing roughness/normal behavior.
 * @evidence contracts/performance.md#efficient-algorithms The shape chooses no composition algorithm; applying overlays scales with ordered layer count and shader/image work in its actual consumer.
 * @evidence contracts/performance.md#reuse-equivalent-work Texture references may be shared by their cache owners, but equivalence depends on texture content/sampling and full overlay parameters rather than this type alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Textures are borrowed references and the shape acquires/disposes no GPU resource; material/cache ownership governs their retained lifetime.
 */
export interface IMaterialOverlayShading {
  /** sRGB colour, coverage in alpha. */
  color: THREE.Texture;

  /** Whether the colour tints the base colour or replaces it. */
  blend: "multiply" | "replace";

  /** Linear factors on the image's colour. */
  colorFactor: { r: number; g: number; b: number };

  /** Roughness where it covers, or `null` to keep the material's. */
  roughness: number | null;

  /** Tangent-space normal map, or `null`. */
  normal: THREE.Texture | null;

  /** Factor on the normal map's slopes. */
  normalScale: number;

  /** Factor on the coverage and the slopes, `[0, 1]`. */
  strength: number;
}
