import type { IAutoMovieHumanFaceOralCrownSupport } from "../../structures/IAutoMovieHumanFaceOralCrownSupport";

/**
 * Admit exactly the permanent ISO quadrant/position identifiers in the source contract. The two-character language matches its template-literal type; no deciduous, unknown or unregistered geometry is inferred from a name.
 *
 * @evidence contracts/common.md#principled-implementation Two characters in the permanent quadrant/position language narrow source ids to the established template-literal contract.
 * @evidence contracts/common.md#clear-and-simple-design Native crown extraction uses this exact source-identity admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A valid name does not infer deciduous/unknown/registered geometry or clinical tooth presence.
 * @evidence contracts/common.md#meaningful-documentation The accepted language is quadrant one-to-four followed by position one-to-eight with exact length two.
 * @evidence contracts/performance.md#efficient-algorithms Fixed two-character length/grammar checks take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The source reader reuses one predicate for region filtering and narrowed crown identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean/type narrowing escapes and no geometry or id collection is retained.
 *
 * @author Samchon
 */
export function isHumanFaceOralToothId(
  id: string,
): id is IAutoMovieHumanFaceOralCrownSupport["id"] {
  return id.length === 2 && /^[1-4][1-8]$/.test(id);
}
