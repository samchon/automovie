import { productionProjectEncodeId } from "./productionProjectEncodeId";

/**
 * Refuse production ids that cannot name a portable encoded namespace.
 *
 * @evidence contracts/common.md#principled-implementation Requires trimmed nonblank input distinct from dot/parent-dot and without a trailing dot, then runs the shared canonical segment encoder; registry admission separately detects case-folded encoded collisions.
 * @evidence contracts/common.md#clear-and-simple-design Owns production-only spelling requirements while shared id encoding and collection collision policy remain with their dedicated helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never repairs spelling by trimming, removing dots or changing case; individual validity does not certify uniqueness among registered production ids.
 * @evidence contracts/common.md#meaningful-documentation States the portable directory identity constraints and the caller's need for collection collision admission before registration.
 * @evidence contracts/performance.md#efficient-algorithms Performs string trim/end checks and one encoding pass proportional to id length; no registry population is traversed by this scalar validator.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A spelling admission has no completed effect or acquired object to share, and each mutable ingress value is checked directly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns void without retaining the id or encoding; no descriptor, lease, lock or task is acquired.
 */
export function productionProjectValidateProductionId(id: string): void {
    if (id.trim().length === 0 ||
        id.trim() !== id ||
        id === "." ||
        id === ".." ||
        id.endsWith("."))
        throw new Error(`Production id "${id}" must be trimmed, non-empty, and must not be ".", "..", or end in a dot. Choose one portable directory identity.`);
    productionProjectEncodeId(id);
}
