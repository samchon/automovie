import * as THREE from "three";

/**
 * One overlay with its images decoded.
 *
 * @author Samchon
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

