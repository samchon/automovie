import path from "node:path";
import { productionProjectEncodeId } from "./productionProjectEncodeId";

/**
 * Address the active production's resident incarnation record.
 *
 * @evidence contracts/common.md#principled-implementation Joins the reserved state root, productions, encoded id and incarnation.json, using the same segment owner as activation and read-only registration.
 * @evidence contracts/common.md#clear-and-simple-design Centralizes generation-record addressing independently of schema validation and physical owned-file acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Formatting does not assert that a record exists or belongs to the current physical namespace; consumers perform those checks before using its id.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the production-specific incarnation from the project-wide incarnation.json and from portable registry identity.
 * @evidence contracts/performance.md#efficient-algorithms Cost is string encoding and fixed-segment path joining proportional to id/root lengths, with no registry or directory scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One pure path computation has no effectful or acquired result requiring request-level reuse; opening consumers keep the resulting string when needed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the path string transfers to the caller; this helper acquires no handle, lock or task and retains no record bytes.
 */
export function productionProjectProductionIncarnationPathOf(automovieRoot: string, productionId: string): string {
    return path.join(automovieRoot, "productions", productionProjectEncodeId(productionId), "incarnation.json");
}
