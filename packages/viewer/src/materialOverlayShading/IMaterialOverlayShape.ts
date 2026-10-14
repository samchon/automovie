/**
 * What decides an overlay's shader code: its blend and which of its parts it carries.
 *
 * @evidence contracts/common.md#principled-implementation Projects only blend and presence of roughness/normal because those select shader structure; actual scalar values and images remain uniforms.
 * @evidence contracts/common.md#clear-and-simple-design Three structural fields separate program-source identity from per-material shading values without duplicating the full overlay transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A structural match does not mean equal appearance or permission to share mutable texture/uniform ownership.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies which optional overlay components alter generated shader code.
 * @evidence contracts/performance.md#efficient-algorithms The type performs no shader expansion; its consumer maps O(L) ordered layers into structural keys and source statements.
 * @evidence contracts/performance.md#reuse-equivalent-work Equivalent ordered shapes may select an equivalent program source while each material keeps its own actual uniform values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Boolean/string structure fields own no texture, material or program handle and retain no layer cache.
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
