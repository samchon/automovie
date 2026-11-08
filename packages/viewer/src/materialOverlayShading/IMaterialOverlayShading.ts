import * as THREE from "three";

/**
 * One overlay with its images decoded.
 *
 * @evidence contracts/development/design.md#principled-representation Represents decoded overlay textures separately from blend, linear colour factors, optional roughness/normal and their dimensionless scales.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The interface supplies exactly material composition inputs while texture decoding/cache ownership and shader source generation retain their own owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Strength and scales preserve application-admitted parameters; the type itself is not runtime range validation or a physical tissue acceptance verdict.
 * @evidence contracts/development/common.md#meaningful-documentation Members document sRGB/alpha versus linear factors, multiply/replace meaning and null keeping existing roughness/normal behavior.
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
