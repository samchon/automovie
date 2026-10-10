import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";

/**
 * Serialize the oral publisher's exact native source fingerprint population.
 * Ordered neutral vertices, incidence, target rows, rigid attachments and
 * material/UV regions are retained. Missing attachments have one empty-array
 * representation. This identifies original source data, not final posed
 * geometry, clinical validity or the authenticity of a supplied rights claim.
 * @author Samchon
 */
export function serializeHumanFaceOralNativeSource(
  source: IAutoMovieHumanFaceBasisSurface,
): string {
  return JSON.stringify({
    positions: source.positions,
    indices: source.indices,
    targets: source.targets,
    attachments: source.attachments ?? [],
    regions: source.regions,
  });
}
