import type { IAutoMovieHumanFaceOralCrownSupport } from "../../structures/IAutoMovieHumanFaceOralCrownSupport";

/**
 * Admit exactly the permanent ISO quadrant/position identifiers in the source
 * contract. The two-character language matches its template-literal type;
 * no deciduous, unknown or unregistered geometry is inferred from a name.
 * @author Samchon
 */
export function isHumanFaceOralToothId(
  id: string,
): id is IAutoMovieHumanFaceOralCrownSupport["id"] {
  return id.length === 2 && /^[1-4][1-8]$/.test(id);
}
