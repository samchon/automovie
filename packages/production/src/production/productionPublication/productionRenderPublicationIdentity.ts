import type { IAutoMovieProductionPublicationIdentity } from "@automovie/interface";
import { type IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import type { IProductionPublicationBasis } from "./IProductionPublicationBasis";
import { productionPublicationDigestValue } from "./productionPublicationDigestValue";
import { productionPublicationBasis } from "./productionPublicationBasis";

/**
 * Build a fingerprinted metadata identity from one admitted render plan.
 *
 * @evidence contracts/common.md#principled-implementation The complete projected basis is canonically hashed once and returned with that fingerprint; semantic plan validity and actual runtime currentness remain caller premises.
 * @evidence contracts/common.md#clear-and-simple-design Current-publication admission reuses this same producer for its expected identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Self-consistency is not media verification or proof of physical publication; no receipt is synthesized from absent bytes.
 * @evidence contracts/common.md#meaningful-documentation States the admitted-plan premise, complete basis projection and caller-owned plain result.
 * @evidence contracts/performance.md#efficient-algorithms Includes basis cloning and every frame/track digest, then full basis canonicalization/hash and the result spread; no fixed byte or chunk budget is enforced here.
 * @evidence contracts/performance.md#reuse-equivalent-work One basis supplies both the fingerprint and returned fields, rather than separately rebuilding equivalent projections.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned identity transfers cloned metadata and copied records to the caller; buffers expire after hashing and no descriptor or task is acquired.
 */
export const productionRenderPublicationIdentity: (plan: IAutoMovieProductionRenderJobPlan) => IAutoMovieProductionPublicationIdentity = (plan: IAutoMovieProductionRenderJobPlan): IAutoMovieProductionPublicationIdentity => {
    const basis: IProductionPublicationBasis = productionPublicationBasis(plan);
    return {
        ...basis,
        fingerprint: productionPublicationDigestValue(basis),
    };
};
