import type { IAutoMovieHumanFaceOralCrownSupport } from "../../structures/IAutoMovieHumanFaceOralCrownSupport";

/**
 * Admit exactly the permanent ISO quadrant/position identifiers in the source
 * contract. The two-character language matches its template-literal type;
 * no deciduous, unknown or unregistered geometry is inferred from a name.
 * @evidence contracts/common.md#principled-implementation The first digit is one of four permanent quadrants and the second one of eight positions, exactly the declared finite identifier language.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Runtime validation precedes narrowing; no unchecked publisher cast fabricates tooth identity.
 * @author Samchon
 */
export function isHumanFaceOralToothId(id: string): id is IAutoMovieHumanFaceOralCrownSupport["id"] {
  return id.length === 2 && /^[1-4][1-8]$/.test(id);
}
