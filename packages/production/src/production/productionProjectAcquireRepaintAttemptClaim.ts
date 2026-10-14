import type { IAutoMovieRepaintAttemptRecord } from "./repaintExecution";
import type { IAutoMovieProductionProjectStoredRepaintClaim as IAutoMovieStoredRepaintAttemptClaim } from "./IAutoMovieProductionProjectStoredRepaintClaim";
import path from "node:path";
import typia from "typia";
import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { type AutoMovieRepaintClaimAdmission, type IAutoMovieRepaintAttemptClaim, assertAutoMovieRepaintAttemptClaim } from "./repaintAttemptClaim";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectRepaintAttemptClaimPath } from "./productionProjectRepaintAttemptClaimPath";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectRepaintRequestAttempts } from "./productionProjectRepaintRequestAttempts";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Reserve the next attempt under the existing production transaction before provider dispatch.
 *
 * @evidence contracts/common.md#principled-implementation Claim admission precedes the commit lock; inside it the complete current attempt prefix is hashed and the resident exact-schema claim checked before ordinal, production, prefix and generation agreement permit acquisition.
 * @evidence contracts/common.md#clear-and-simple-design The claim operation owns reservation metadata and admission status; commitFiles owns revision/namespace locking and execution owns provider dispatch and eventual settlement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An active owner or unknown outcome blocks takeover; changed prefix/generation returns its explicit status without staging a replacement, and an empty transaction does not publish a revision here.
 * @evidence contracts/common.md#meaningful-documentation Defines acquired, already-active, unknown-outcome and prefix-changed outcomes; resident parsing/schema errors and transaction races throw rather than becoming acquisition success.
 * @evidence contracts/performance.md#efficient-algorithms Includes one complete attempt enumeration/validation/sort, canonical prefix serialization/hash and resident claim parse, plus transaction guards and staging; costs scale with prefix/claim bytes and attempt population rather than only one claim field.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical current-prefix digest serves all admission comparisons inside the lock; previous request identity alone cannot replace fresh prefix and resident ownership observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Attempt records, canonical bytes, resident claim and cloned staged claim are local; commitFiles releases locks and reader descriptors, and only the compact admission status escapes without starting a provider task.
 */
export function productionProjectAcquireRepaintAttemptClaim(state: AutoMovieProductionProjectState, claim: IAutoMovieRepaintAttemptClaim): AutoMovieRepaintClaimAdmission {
    assertAutoMovieRepaintAttemptClaim(claim);
    const claimPath: string = productionProjectRepaintAttemptClaimPath(claim.requestId);
    let admission: AutoMovieRepaintClaimAdmission = {
        status: "prefix-changed",
    };
    productionProjectCommitFiles(state, (): { path: string; content: string; }[] => {
        const attempts: IAutoMovieRepaintAttemptRecord[] = productionProjectRepaintRequestAttempts(state, claim.requestId);
        const prefixDigest: string = digestAutoMovieBytes(canonicalAutoMovieJsonBytes(attempts));
        const resident: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, claimPath);
        const current: typia.IValidation<IAutoMovieStoredRepaintAttemptClaim> | null = resident === null
            ? null
            : typia.validateEquals<IAutoMovieStoredRepaintAttemptClaim>(parseAutoMovieStructuredJson({
                record: "repaint-attempt-claim",
                bytes: resident,
            }));
        if (current !== null && current.success === false)
            throw new Error("Stored repaint attempt claim is malformed.");
        if (claim.productionId !== state.productionId ||
            claim.prefixDigest !== prefixDigest ||
            claim.attemptOrdinal !== attempts.length + 1) {
            admission = { status: "prefix-changed" };
            return [];
        }
        if (current !== null && current.data.settlement === null) {
            admission = {
                status: "already-active",
                ownerAttemptId: current.data.claim.attemptId,
            };
            return [];
        }
        if (current !== null && current.data.settlement === "unknown-outcome") {
            admission = {
                status: "unknown-outcome",
                ownerAttemptId: current.data.claim.attemptId,
            };
            return [];
        }
        if (current !== null &&
            (claim.generation !== current.data.claim.generation + 1 ||
                claim.requestFingerprint !==
                    current.data.claim.requestFingerprint ||
                claim.shot !== current.data.claim.shot)) {
            admission = { status: "prefix-changed" };
            return [];
        }
        admission = { status: "acquired" };
        return [
            {
                path: path.join(state.productionStateRoot, ...claimPath.split("/")),
                content: productionProjectSerializeJson({
                    claim: structuredClone(claim),
                    settlement: null,
                } satisfies IAutoMovieStoredRepaintAttemptClaim),
            },
        ];
    }, undefined, state.lastReadRevision_, undefined, false);
    return admission;
}
