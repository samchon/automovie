import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";

/**
 * Serialize the oral publisher's exact native source fingerprint population.
 * Ordered neutral vertices, incidence, target rows, rigid attachments and
 * material/UV regions are retained. Missing attachments have one empty-array
 * representation. This identifies original source data, not final posed
 * geometry, clinical validity or the authenticity of a supplied rights claim.
 * @evidence contracts/common.md#principled-implementation Publisher and export factory hash one fixed ordered JSON population with identical omitted-attachment normalization.
 * @evidence contracts/common.md#clear-and-simple-design One wire owner prevents producer/consumer source digest formulas from drifting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither geometry similarity nor a final asset hash substitutes for the original source fingerprint.
 * @evidence contracts/common.md#meaningful-documentation Names the exact included source fields and independent clinical/rights authority.
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
