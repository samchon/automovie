import { IAutoMovieProductionDeliverable, IAutoMovieProductionMediaProbe } from "@automovie/interface";
import type { IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import { IAutoMovieProductionSemanticMaskReceipt } from "./IAutoMovieProductionSemanticMaskReceipt";
import { verifyAutoMovieProductionSemanticMaskReceipt } from "./verifyAutoMovieProductionSemanticMaskReceipt";
import { productionRenderPlanOwnsSemanticMaskReceipt } from "./productionRenderPlanOwnsSemanticMaskReceipt";
import { AutoMovieProductionDeliverableSemanticMaskFinding } from "./AutoMovieProductionDeliverableSemanticMaskFinding";

/**
 * Classify a typed delivered file against its parsed medium, exact ledger path, current mask plan and resident sidecar bytes. Missing receipt, foreign association/plan, reopen failure and runtime gaps remain distinct causes; field/plan failures before the reopen catch can propagate.
 *
 * @evidence contracts/common.md#principled-implementation Ordinary files require neither receipt nor semantic probe; semantic files require guide kind, semantic probe, exact sidecar path, scheduled frame/shot, canonical receipt reopen and zero unresolved/unaddressed coverage.
 * @evidence contracts/common.md#clear-and-simple-design A shared classifier serves final diagnostics and immutable terminal publication so those current boundaries use one mask admission policy; it starts no renderer or deleted proxy orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No semantic sidecar is admitted solely by a digest or schedule claim, and incomplete coverage is not rewritten or hidden. Typed ledger/probe/plan inputs must already come from their respective readers.
 * @evidence contracts/common.md#meaningful-documentation Documents each status, exact resident-byte/plan correspondence, borrowed receipt return and the limited catch boundary rather than promising all malformed values become a finding.
 * @evidence contracts/performance.md#efficient-algorithms Fixed association/path checks precede plan C/F/L scans and selected-layer clone cost, then full receipt reopen including own-key sorting, repeated palette canonicalization/hashing, B byte copies/comparison and U coverage scans. Payload graphs, sidecar bytes and lists are uncapped here.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's parsed probe and resident bytes and returns the original admitted receipt; no media is reparsed in this classifier and no cross-generation success cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finding/reason records and verifier/plan temporaries are invocation-local; caller keeps admitted receipt/probe/bytes as needed. No file handle or task is opened, and thrown or returned refusal does not own the reader's payload lifetime.
 */
export const classifyAutoMovieProductionDeliverableSemanticMask: (props: {

    /** Current ledger deliverable identity and declared kind. */
    deliverable: {

        /** Exact deliverable identifier that must own the scheduled mask chunk. */
        id: string;

        /** Declared deliverable kind selecting the supported media association. */
        kind: IAutoMovieProductionDeliverable["kind"];
    };

    /** Current ledger path and optional semantic receipt. */
    file: {

        /** Portable relative identity compared exactly; this record alone does not resolve filesystem links. */
        path: string;

        /** Optional committed semantic receipt; semantic sidecar probes require one, ordinary media does not. */
        semanticMask?: IAutoMovieProductionSemanticMaskReceipt;
    };

    /** Already parsed media facts; this function does not decode the payload again. */
    probe: IAutoMovieProductionMediaProbe;

    /** Complete supplied media or sidecar bytes, borrowed for this invocation. */
    bytes: Uint8Array;

    /** Current render job plan whose mask layer determines receipt ownership. */
    plan: IAutoMovieProductionRenderJobPlan;
}) => AutoMovieProductionDeliverableSemanticMaskFinding = (props: {

    /** Current ledger deliverable identity and declared kind. */
    deliverable: {

        /** Exact deliverable identifier that must own the scheduled mask chunk. */
        id: string;

        /** Declared deliverable kind selecting the supported media association. */
        kind: IAutoMovieProductionDeliverable["kind"];
    };

    /** Current ledger path and optional semantic receipt. */
    file: {

        /** Portable relative identity compared exactly; this record alone does not resolve filesystem links. */
        path: string;

        /** Optional committed semantic receipt; semantic sidecar probes require one, ordinary media does not. */
        semanticMask?: IAutoMovieProductionSemanticMaskReceipt;
    };

    /** Already parsed media facts; this function does not decode the payload again. */
    probe: IAutoMovieProductionMediaProbe;

    /** Complete supplied media or sidecar bytes, borrowed for this invocation. */
    bytes: Uint8Array;

    /** Current render job plan whose mask layer determines receipt ownership. */
    plan: IAutoMovieProductionRenderJobPlan;
}): AutoMovieProductionDeliverableSemanticMaskFinding => {
    const { deliverable, file, probe }: typeof props = props;
    if (file.semanticMask === undefined)
        return probe.kind === "semantic-mask"
            ? {
                status: "unreceipted",
                reason: `Semantic sidecar "${file.path}" has no semantic receipt in its deliverable ledger.`,
            }
            : { status: "media" };
    const receipt: IAutoMovieProductionSemanticMaskReceipt = file.semanticMask;
    if (deliverable.kind !== "guide-pass")
        return {
            status: "unbound",
            reason: `Semantic receipt on "${file.path}" belongs to ${deliverable.kind} deliverable "${deliverable.id}"; only a guide-pass deliverable owns mask sidecars.`,
        };
    if (probe.kind !== "semantic-mask")
        return {
            status: "unbound",
            reason: `Semantic receipt on "${file.path}" describes bytes that are not a semantic-mask sidecar.`,
        };
    if (receipt.sidecar.path !== file.path)
        return {
            status: "unbound",
            reason: `Semantic receipt on "${file.path}" names sidecar path "${receipt.sidecar.path}".`,
        };
    if (productionRenderPlanOwnsSemanticMaskReceipt({
        plan: props.plan,
        deliverable: deliverable.id,
        receipt,
    }) === false)
        return {
            status: "unbound",
            reason: `Semantic sidecar "${file.path}" is not bound to a current mask frame ${receipt.frame} of shot "${receipt.shot}" in guide deliverable "${deliverable.id}".`,
        };
    try {
        verifyAutoMovieProductionSemanticMaskReceipt({
            receipt,
            expectedFrame: receipt.frame,
            expectedShot: receipt.shot,
            evidence: {
                version: 1,
                shot: receipt.shot,
                mask: probe.mask,
                coverage: receipt.coverage,
            },
            resident: { path: file.path, bytes: props.bytes },
        });
    }
    catch (error) {
        return { status: "stale", reason: (error as Error).message };
    }
    if (receipt.coverage.unresolved.length !== 0 ||
        receipt.coverage.unaddressed !== 0)
        return {
            status: "incomplete",
            reason: `Semantic sidecar "${file.path}" records ${receipt.coverage.unresolved.length} unresolved ids and ${receipt.coverage.unaddressed} unaddressed meshes for shot "${receipt.shot}"; a delivered mask product requires complete runtime coverage.`,
        };
    return { status: "semantic-mask", receipt };
};
