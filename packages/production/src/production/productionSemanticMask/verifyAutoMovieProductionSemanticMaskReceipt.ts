import { IAutoMovieProductionSemanticMaskEvidence } from "./IAutoMovieProductionSemanticMaskEvidence";
import { IAutoMovieProductionSemanticMaskReceipt } from "./IAutoMovieProductionSemanticMaskReceipt";
import { verifyAutoMovieProductionSemanticMaskEvidence } from "./verifyAutoMovieProductionSemanticMaskEvidence";
import { createAutoMovieProductionSemanticMaskReceipt } from "./createAutoMovieProductionSemanticMaskReceipt";
import { productionSemanticMaskExactKeys } from "./productionSemanticMaskExactKeys";
import { productionSemanticMaskVerifyCoverage } from "./productionSemanticMaskVerifyCoverage";
import { productionSemanticMaskVerifyFrame } from "./productionSemanticMaskVerifyFrame";
import { productionSemanticMaskVerifySidecarPath } from "./productionSemanticMaskVerifySidecarPath";
import { productionSemanticMaskSameCoverage } from "./productionSemanticMaskSameCoverage";

/**
 * Reopen a typed receipt against its exact expected mask frame, shot, portable resident path, complete canonical palette bytes and ordered coverage. Any mismatch throws; resident file acquisition and current plan selection remain the caller's responsibility.
 *
 * @evidence contracts/common.md#principled-implementation Checks exact receipt/sidecar key sets and protocol fields, validates evidence/path, recreates the canonical receipt from resident bytes, then compares byte digest/length, semantic digest and ordered coverage.
 * @evidence contracts/common.md#clear-and-simple-design Recreation uses the same receipt constructor as capture sealing so creation and reopening cannot disagree on byte identity or coverage copying.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither stale fields nor noncanonical resident bytes are normalized into acceptance. Hashes are actual sidecar/palette identities, not authored prose certificates. Ordered coverage comparison assumes dense arrays; shared admission and equality skip sparse holes, so arbitrary host arrays are not fully admitted by this boundary.
 * @evidence contracts/common.md#meaningful-documentation Documents typed-record input, exact frame/shot/path requirements, thrown mismatch categories and the caller-owned filesystem/current-plan boundary.
 * @evidence contracts/performance.md#efficient-algorithms Actual own-key arrays cost K log K sorting; coverage/path scans and complete evidence verification precede constructor re-verification/rendering/hashing. Canonical bytes and supplied-byte copies plus U coverage identifiers add input-dependent memory; equality is not merely a constant scalar tuple check.
 * @evidence contracts/performance.md#reuse-equivalent-work The recreated receipt is shared by the byte and semantic comparisons in this invocation. Resident bytes are independently supplied by the reader and no earlier successful receipt check is trusted across changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Recreated receipt, key arrays and canonical buffers are local through success or throw; input records/bytes remain caller-owned. No filesystem handle or asynchronous task is acquired here and the caller controls returned-input retention.
 */
export const verifyAutoMovieProductionSemanticMaskReceipt: (props: {

    /** Committed semantic receipt whose frame, shot, coverage and bytes must match. */
    receipt: IAutoMovieProductionSemanticMaskReceipt;

    /** Non-negative safe integer frame identity expected by the current owner. */
    expectedFrame: number;

    /** Exact shot identifier this boundary admits. */
    expectedShot: string;

    /** Atomic palette and coverage observation supplied by the capture or resident sidecar owner. */
    evidence: IAutoMovieProductionSemanticMaskEvidence;

    /** Actual reopened path and bytes compared with the receipt. */
    resident: {

        /** Portable relative identity compared exactly; this record alone does not resolve filesystem links. */
        path: string;

        /** Complete supplied media or sidecar bytes, borrowed for this invocation. */
        bytes: Uint8Array;
    };
}) => void = (props: {

    /** Committed semantic receipt whose frame, shot, coverage and bytes must match. */
    receipt: IAutoMovieProductionSemanticMaskReceipt;

    /** Non-negative safe integer frame identity expected by the current owner. */
    expectedFrame: number;

    /** Exact shot identifier this boundary admits. */
    expectedShot: string;

    /** Atomic palette and coverage observation supplied by the capture or resident sidecar owner. */
    evidence: IAutoMovieProductionSemanticMaskEvidence;

    /** Actual reopened path and bytes compared with the receipt. */
    resident: {

        /** Portable relative identity compared exactly; this record alone does not resolve filesystem links. */
        path: string;

        /** Complete supplied media or sidecar bytes, borrowed for this invocation. */
        bytes: Uint8Array;
    };
}): void => {
    productionSemanticMaskExactKeys(props.receipt, [
        "version",
        "frame",
        "pass",
        "shot",
        "sidecar",
        "semanticDigest",
        "coverage",
    ], "receipt");
    productionSemanticMaskExactKeys(props.receipt.sidecar, ["path", "digest", "bytes"], "sidecar");
    productionSemanticMaskVerifyCoverage(props.receipt.coverage);
    productionSemanticMaskVerifySidecarPath(props.receipt.sidecar.path);
    if (props.receipt.version !== 1)
        throw new Error(`unsupported semantic receipt version ${String(props.receipt.version)}; expected 1`);
    productionSemanticMaskVerifyFrame(props.expectedFrame);
    if (props.receipt.frame !== props.expectedFrame ||
        props.receipt.pass !== "mask")
        throw new Error(`stale semantic receipt frame ${String(props.receipt.frame)}/${String(props.receipt.pass)}; expected mask frame ${props.expectedFrame}`);
    verifyAutoMovieProductionSemanticMaskEvidence({
        evidence: props.evidence,
        expectedShot: props.expectedShot,
    });
    if (props.receipt.shot !== props.expectedShot)
        throw new Error(`foreign semantic receipt for shot "${props.receipt.shot}"; expected "${props.expectedShot}"`);
    productionSemanticMaskVerifySidecarPath(props.resident.path);
    if (props.receipt.sidecar.path !== props.resident.path)
        throw new Error(`foreign semantic sidecar path "${props.resident.path}"; expected "${props.receipt.sidecar.path}"`);
    const recreated: IAutoMovieProductionSemanticMaskReceipt = createAutoMovieProductionSemanticMaskReceipt({
        frame: props.expectedFrame,
        expectedShot: props.expectedShot,
        evidence: props.evidence,
        sidecar: props.resident,
    });
    if (props.receipt.sidecar.digest !== recreated.sidecar.digest ||
        props.receipt.sidecar.bytes !== recreated.sidecar.bytes)
        throw new Error(`tampered semantic sidecar for shot "${props.expectedShot}" does not match its receipt`);
    if (props.receipt.semanticDigest !== recreated.semanticDigest ||
        productionSemanticMaskSameCoverage(props.receipt.coverage, recreated.coverage) === false)
        throw new Error(`stale semantic payload for shot "${props.expectedShot}" does not match its receipt`);
};
