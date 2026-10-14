import type { IAutoMovieProductionPublicationIdentity } from "@automovie/interface";

/**
 * Publication identity fields before the canonical basis digest is attached.
 *
 * @evidence contracts/common.md#principled-implementation Omit removes only fingerprint so one complete projected basis supplies both its digest and the returned identity.
 * @evidence contracts/common.md#clear-and-simple-design The producer shares this structural projection between identity creation and current-plan comparison without a second schema or host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A basis type cannot prove plan admission, installed runtime identity or actual media bytes; those remain producer/caller premises.
 * @evidence contracts/common.md#meaningful-documentation Inherits namespace, protocol, copied runtime/tier/format metadata and complete frame/track digest fields from the canonical interface while excluding fingerprint only.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased alias executes no serialization, hashing, traversal or host mutation; productionPublicationBasis owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The alias creates no retained plan cache or observed-input reuse policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased shape owns no handle or task; the producer and caller own projected metadata lifetime.
 */
export type IProductionPublicationBasis = Omit<IAutoMovieProductionPublicationIdentity, "fingerprint">;
