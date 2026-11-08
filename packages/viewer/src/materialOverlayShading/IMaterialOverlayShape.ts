/**
 * What decides an overlay's shader code: its blend and which of its parts it carries.
 *
 * @evidence contracts/development/design.md#principled-representation Projects only blend and presence of roughness/normal because those select shader structure; actual scalar values and images remain uniforms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three structural fields separate program-source identity from per-material shading values without duplicating the full overlay transport.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A structural match does not mean equal appearance or permission to share mutable texture/uniform ownership.
 * @evidence contracts/development/common.md#meaningful-documentation Documentation identifies which optional overlay components alter generated shader code.
 */
export interface IMaterialOverlayShape {
  /** Whether the colour tints the base colour or replaces it. */
  blend: "multiply" | "replace";

  /** Whether the overlay sets its own roughness. */
  roughness: boolean;

  /** Whether the overlay carries a normal map. */
  normal: boolean;
}
