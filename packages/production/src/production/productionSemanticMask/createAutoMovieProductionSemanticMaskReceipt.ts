import { renderAutoMovieSemanticMaskSidecar } from "@automovie/engine";
import { digestAutoMovieBytes } from "../contentIdentity";
import { IAutoMovieProductionSemanticMaskEvidence } from "./IAutoMovieProductionSemanticMaskEvidence";
import { IAutoMovieProductionSemanticMaskReceipt } from "./IAutoMovieProductionSemanticMaskReceipt";
import { verifyAutoMovieProductionSemanticMaskEvidence } from "./verifyAutoMovieProductionSemanticMaskEvidence";
import { productionSemanticMaskVerifyFrame } from "./productionSemanticMaskVerifyFrame";
import { productionSemanticMaskVerifySidecarPath } from "./productionSemanticMaskVerifySidecarPath";

/**
 * Seal one non-negative safe integer mask frame's exact canonical sidecar bytes, shot and runtime coverage into a version-1 receipt. Sidecar paths are portable relative identities; this check alone does not resolve filesystem links or prove current plan membership.
 *
 * @evidence contracts/common.md#principled-implementation Validates frame, shot evidence and path, reconstructs canonical engine sidecar UTF-8 bytes, requires byte equality, hashes actual supplied bytes and copies ordered coverage into the receipt.
 * @evidence contracts/common.md#clear-and-simple-design Receipt construction stays with production correspondence while the engine defines canonical palette text and the byte digest owner defines SHA-256 identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No newline, whitespace, palette ordering or supplied bytes are repaired to match; exact canonical bytes are required. Sidecar segment admission proves neither every platform's filename validity nor physical confinement. Dense unresolved arrays are an unchecked premise: shared coverage admission skips holes and the spread copy turns such holes into undefined values.
 * @evidence contracts/common.md#meaningful-documentation Documents frame range, canonical byte requirement, copied coverage, borrowed bytes and the additional reader/plan checks needed before final admission.
 * @evidence contracts/performance.md#efficient-algorithms Includes evidence verification, then sidecar rendering's additional engine verification/canonicalization, entry/gap sorting and text/hash work. For B supplied/canonical bytes, two Buffer constructions, comparison and supplied-byte hashing add O(B) work/space; U unresolved identifiers are copied, with no fixed total payload bound.
 * @evidence contracts/performance.md#reuse-equivalent-work One canonical buffer serves equality within this invocation; repeated engine verification remains in the existing renderer path and no cross-call cache assumes a mutable palette or coverage is unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Canonical and supplied-byte Buffer copies coexist during validation; caller owns the returned receipt and copied unresolved array afterward. Bytes are borrowed, no handles/tasks are acquired and palette/text size is uncapped here.
 */
export const createAutoMovieProductionSemanticMaskReceipt: (props: {

    /** Non-negative safe integer output frame identity sealed into this receipt. */
    frame: number;

    /** Exact shot identifier this boundary admits. */
    expectedShot: string;

    /** Atomic palette and coverage observation supplied by the capture or resident sidecar owner. */
    evidence: IAutoMovieProductionSemanticMaskEvidence;

    /** Canonical palette sidecar address and complete resident bytes. */
    sidecar: {

        /** Portable relative identity compared exactly; this record alone does not resolve filesystem links. */
        path: string;

        /** Complete supplied media or sidecar bytes, borrowed for this invocation. */
        bytes: Uint8Array;
    };
}) => IAutoMovieProductionSemanticMaskReceipt = (props: {

    /** Non-negative safe integer output frame identity sealed into this receipt. */
    frame: number;

    /** Exact shot identifier this boundary admits. */
    expectedShot: string;

    /** Atomic palette and coverage observation supplied by the capture or resident sidecar owner. */
    evidence: IAutoMovieProductionSemanticMaskEvidence;

    /** Canonical palette sidecar address and complete resident bytes. */
    sidecar: {

        /** Portable relative identity compared exactly; this record alone does not resolve filesystem links. */
        path: string;

        /** Complete supplied media or sidecar bytes, borrowed for this invocation. */
        bytes: Uint8Array;
    };
}): IAutoMovieProductionSemanticMaskReceipt => {
    productionSemanticMaskVerifyFrame(props.frame);
    verifyAutoMovieProductionSemanticMaskEvidence({
        evidence: props.evidence,
        expectedShot: props.expectedShot,
    });
    productionSemanticMaskVerifySidecarPath(props.sidecar.path);
    const expected: Buffer = Buffer.from(renderAutoMovieSemanticMaskSidecar(props.evidence.mask), "utf8");
    if (Buffer.from(props.sidecar.bytes).equals(expected) === false)
        throw new Error(`semantic sidecar bytes for shot "${props.evidence.shot}" do not match its canonical palette`);
    return {
        version: 1,
        frame: props.frame,
        pass: "mask",
        shot: props.evidence.shot,
        sidecar: {
            path: props.sidecar.path,
            digest: digestAutoMovieBytes(props.sidecar.bytes),
            bytes: props.sidecar.bytes.byteLength,
        },
        semanticDigest: props.evidence.mask.digest,
        coverage: {
            unresolved: [...props.evidence.coverage.unresolved],
            unaddressed: props.evidence.coverage.unaddressed,
        },
    };
};
