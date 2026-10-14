import type { IAutoMovieProductionProjectStoredRepaintClaim as IAutoMovieStoredRepaintAttemptClaim } from "./IAutoMovieProductionProjectStoredRepaintClaim";
import path from "node:path";
import typia from "typia";
import { canonicalizeAutoMovieJson } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { type AutoMovieRepaintClaimSettlement, type IAutoMovieRepaintAttemptClaim, assertAutoMovieRepaintAttemptClaim } from "./repaintAttemptClaim";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectRepaintAttemptClaimPath } from "./productionProjectRepaintAttemptClaimPath";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Persist one settlement only while the complete immutable claim still belongs to its caller.
 *
 * @evidence contracts/common.md#principled-implementation Claim validation precedes the locked resident read; exact schema and canonical equality of the entire claim establish ownership, and a prior settlement must equal the requested settlement before its replacement record is staged.
 * @evidence contracts/common.md#clear-and-simple-design Settlement metadata remains separate from terminal attempt/output publication; the shared transaction owner supplies generation, revision and rollback authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or changed resident ownership refuses, and conflicting settlement is not overwritten; no provider outcome is inferred from the caller's requested classification.
 * @evidence contracts/common.md#meaningful-documentation States canonical claim ownership and same-settlement compatibility; successful return is the transaction revision, with parsing, ownership and transaction failures propagated.
 * @evidence contracts/performance.md#efficient-algorithms Reads/parses resident claim bytes and canonicalizes two complete claim values, then serializes one staged record; delegated transaction work includes current generation observations and prior/new staged bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted resident claim supplies the replacement's immutable fields; no cached settlement or attempt ID bypasses complete current ownership comparison.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Resident bytes, parsed claim, canonical strings and staged serialization are call-local; commitFiles owns lock/rollback-buffer release and the function retains no claim cache or asynchronous task.
 */
export function productionProjectSettleRepaintAttemptClaim(state: AutoMovieProductionProjectState, claim: IAutoMovieRepaintAttemptClaim, settlement: AutoMovieRepaintClaimSettlement): number {
    assertAutoMovieRepaintAttemptClaim(claim);
    const claimPath: string = productionProjectRepaintAttemptClaimPath(claim.requestId);
    return productionProjectCommitFiles(state, (): { path: string; content: string; }[] => {
        const resident: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, claimPath);
        if (resident === null)
            throw new Error("Repaint attempt claim disappeared before settlement.");
        const current: typia.IValidation<IAutoMovieStoredRepaintAttemptClaim> = typia.validateEquals<IAutoMovieStoredRepaintAttemptClaim>(parseAutoMovieStructuredJson({
            record: "repaint-attempt-claim",
            bytes: resident,
        }));
        if (current.success === false ||
            canonicalizeAutoMovieJson(current.data.claim) !==
                canonicalizeAutoMovieJson(claim) ||
            (current.data.settlement !== null &&
                current.data.settlement !== settlement))
            throw new Error("Repaint attempt claim settlement lost ownership.");
        return [
            {
                path: path.join(state.productionStateRoot, ...claimPath.split("/")),
                content: productionProjectSerializeJson({
                    claim: current.data.claim,
                    settlement,
                } satisfies IAutoMovieStoredRepaintAttemptClaim),
            },
        ];
    });
}
