import type { IAutoMovieHumanBodyGeneratedPart } from "../generated/IAutoMovieHumanBodyGeneratedPart";

/**
 * Every independently reportable generated bone, muscle or soft-tissue ID.
 *
 * @evidence contracts/common.md#principled-implementation Indexed access derives every reportable ID from the generated-part catalogue, preserving the same bone/muscle/soft-tissue inventory.
 * @evidence contracts/common.md#clear-and-simple-design One catalogue remains identity authority rather than a second separately maintained part-name list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Derived IDs cannot silently diverge from tissue-correlated generated-part membership.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies independently reportable generated anatomical owners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Indexed-access identity typing performs no runtime catalogue traversal or generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Catalogue derivation shares type information rather than retained computational results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The part-ID alias owns no report map, geometry storage or running operation.
 * @author Samchon
 */
export type AutoMovieHumanBodyPartId = IAutoMovieHumanBodyGeneratedPart["id"];
