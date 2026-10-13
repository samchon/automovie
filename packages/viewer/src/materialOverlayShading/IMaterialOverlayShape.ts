/**
 * What decides an overlay's shader code: its blend and which of its parts it carries.
 *
 * @author Samchon
 */
export interface IMaterialOverlayShape {
  /** Whether the colour tints the base colour or replaces it. */
  blend: "multiply" | "replace";

  /** Whether the overlay sets its own roughness. */
  roughness: boolean;

  /** Whether the overlay carries a normal map. */
  normal: boolean;
}


