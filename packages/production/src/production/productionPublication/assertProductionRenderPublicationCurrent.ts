import type { IAutoMovieProductionPublicationIdentity } from "@automovie/interface";
import { type IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import { productionPublicationSameCanonicalJson } from "./productionPublicationSameCanonicalJson";
import { productionRenderPublicationIdentity } from "./productionRenderPublicationIdentity";
import { parseProductionRenderPublicationIdentity } from "./parseProductionRenderPublicationIdentity";

/**
 * Require stored publication metadata to equal the supplied current plan's identity.
 *
 * @evidence contracts/common.md#principled-implementation Stored shape/semantic/fingerprint admission runs first, then the current expected identity is constructed and both complete identities are canonically compared.
 * @evidence contracts/common.md#clear-and-simple-design Project terminal publication and final-delivery verification share one current-plan comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A schema-valid or self-consistent historical identity cannot bypass full comparison; the supplied plan must itself represent truthful current host inputs.
 * @evidence contracts/common.md#meaningful-documentation Defines unknown stored input, admitted current plan, returned stored reference and tier-specific refusal.
 * @evidence contracts/performance.md#efficient-algorithms Includes stored parse/recomputation, current basis cloning/frame/track hashing and full identity comparison, with both identities and their temporary encodings resident.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the canonical parser and producer instead of maintaining another partial publication policy; no successful result is cached across plans.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned stored identity remains borrowed; expected cloned metadata and buffers expire, and no physical publication or resource release is performed.
 */
export const assertProductionRenderPublicationCurrent: (props: {
    /** Stored metadata requiring exact shape, semantic and fingerprint admission. */
    identity: unknown;

    /** Caller-admitted current plan whose complete identity must match. */
    plan: IAutoMovieProductionRenderJobPlan;
}) => IAutoMovieProductionPublicationIdentity = (props: {
    /** Stored metadata requiring exact shape, semantic and fingerprint admission. */
    identity: unknown;

    /** Caller-admitted current plan whose complete identity must match. */
    plan: IAutoMovieProductionRenderJobPlan;
}): IAutoMovieProductionPublicationIdentity => {
    const actual: IAutoMovieProductionPublicationIdentity = parseProductionRenderPublicationIdentity(props.identity);
    const expected: IAutoMovieProductionPublicationIdentity = productionRenderPublicationIdentity(props.plan);
    if (productionPublicationSameCanonicalJson(actual, expected) === false)
        throw new Error(`Stored ${actual.tier.kind} publication identity does not match the current ${expected.tier.kind} render plan. Replan and republish this tier.`);
    return actual;
};
