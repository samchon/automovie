import { verifyAutoMovieSemanticMask } from "@automovie/engine";
import { IAutoMovieProductionSemanticMaskEvidence } from "./IAutoMovieProductionSemanticMaskEvidence";
import { productionSemanticMaskExactKeys } from "./productionSemanticMaskExactKeys";
import { productionSemanticMaskVerifyCoverage } from "./productionSemanticMaskVerifyCoverage";
import { productionSemanticMaskNonBlank } from "./productionSemanticMaskNonBlank";

/**
 * Verify a typed version-1 evidence record for one exact expected shot, including the complete engine palette and ordered runtime coverage. Throws on unsupported version, foreign shot, unexpected keys or invalid payload; complete coverage is a later policy decision.
 *
 * @evidence contracts/common.md#principled-implementation Exact own-key sets and version/shot checks precede engine mask verification and coverage admission; the typed input premise supplies a record-shaped envelope.
 * @evidence contracts/common.md#clear-and-simple-design The production envelope owner handles shot/coverage correspondence while the engine owns canonical palette schema and digest verification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is normalized or discarded to admit an observation. The four envelope keys are its protocol; zero coverage gaps is intentionally not imposed at this shared preview verifier. Dense unresolved arrays remain an unchecked host-input premise because coverage admission skips sparse holes.
 * @evidence contracts/common.md#meaningful-documentation States typed envelope premise, exact expected shot, thrown failures and the difference between schema validity and complete runtime coverage.
 * @evidence contracts/performance.md#efficient-algorithms Envelope own-key sorting costs O(K log K) plus key comparisons for actual K keys; palette admission walks and canonicalizes entries/gaps with their sorting/hash/text costs, and coverage scans U unresolved ids and their characters. No independent key, palette, text or depth quota is introduced here.
 * @evidence contracts/performance.md#reuse-equivalent-work The engine verifier owns its canonical digest computation; this envelope invocation shares no cached verdict because a mutable evidence record may have changed since an earlier read.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed evidence is never retained or mutated. Temporary own-key arrays and engine canonical text/hash inputs become collectable after success/failure; no handle or task is acquired and returned void does not imply immediate GC.
 */
export const verifyAutoMovieProductionSemanticMaskEvidence: (props: {

    /** Atomic palette and coverage observation supplied by the capture or resident sidecar owner. */
    evidence: IAutoMovieProductionSemanticMaskEvidence;

    /** Exact shot identifier this boundary admits. */
    expectedShot: string;
}) => void = (props: {

    /** Atomic palette and coverage observation supplied by the capture or resident sidecar owner. */
    evidence: IAutoMovieProductionSemanticMaskEvidence;

    /** Exact shot identifier this boundary admits. */
    expectedShot: string;
}): void => {
    const { evidence, expectedShot }: typeof props = props;
    productionSemanticMaskExactKeys(evidence, ["version", "shot", "mask", "coverage"], "evidence");
    if (evidence.version !== 1)
        throw new Error(`unsupported semantic evidence version ${String(evidence.version)}; expected 1`);
    if (productionSemanticMaskNonBlank(evidence.shot) === false)
        throw new Error("invalid semantic evidence shot; expected a non-blank id");
    if (evidence.shot !== expectedShot)
        throw new Error(`foreign semantic evidence for shot "${evidence.shot}"; expected "${expectedShot}"`);
    verifyAutoMovieSemanticMask(evidence.mask);
    productionSemanticMaskVerifyCoverage(evidence.coverage);
};
