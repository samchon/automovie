import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";

/**
 * Serialize the oral publisher's exact native source fingerprint population. Ordered neutral vertices, incidence, target rows, rigid attachments and material/UV regions are retained. Missing attachments have one empty-array representation. This identifies original source data, not final posed geometry, clinical validity or the authenticity of a supplied rights claim.
 *
 * @evidence contracts/common.md#principled-implementation Ordered native positions, incidence, target rows, rigid attachments and material/UV regions form the publisher's source serialization.
 * @evidence contracts/common.md#clear-and-simple-design The export-qualification owner hashes this exact population separately from final posed geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing attachments normalize only to the specified empty array; serialization proves neither supplied rights claims nor anatomical validity.
 * @evidence contracts/common.md#meaningful-documentation Object field order and original array order retain exact native fingerprint semantics.
 * @evidence contracts/performance.md#efficient-algorithms JSON work and output size scale with the serialized native population and its numeric/string text.
 * @evidence contracts/performance.md#reuse-equivalent-work One serializer is reused for export's actual native digest comparison rather than a second source schema.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the serialized string escapes; input arrays stay borrowed and no source snapshot/cache is retained.
 *
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
