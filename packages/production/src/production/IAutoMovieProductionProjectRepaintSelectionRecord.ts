

/**
 * Historical author selection or reversal linked to one verified repaint candidate.
 *
 * @evidence contracts/common.md#principled-implementation Stores candidate request/attempt identity, selection time and previous selection address so lineage verification can check chronology, cycles and current receipt bytes rather than treating an active pointer as sufficient proof.
 * @evidence contracts/common.md#clear-and-simple-design Separates the authored selection history from generated candidate media and the active pointer; reversing chooses an older admitted candidate while retaining the chain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Review text and continuity pass assertions are authored claims checked for required shape/content, not independently measured playback outcomes or digests bound to a persisted external review receipt.
 * @evidence contracts/common.md#meaningful-documentation Identifies the null initial lineage/baseline states, chronological selection versus reversal, and review assertions' author-owned evidentiary meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This stored record chooses no algorithm; selection and lineage operations own candidate scans, chain reads and media admission costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Historical identity is data rather than reusable effects; consumers reverify current resident receipts and active lineage instead of trusting matching stored strings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources History grows with committed selections/reversals with no automatic pruning here; each record stores scalar review/address data and no media buffers, descriptors or tasks.
 * @author Samchon
 */
export interface IAutoMovieProductionProjectRepaintSelectionRecord {
    /** Historical selection schema version. */
    version: 1;

    /** UUID identifying this authored selection event. */
    selectionId: string;

    /** Selection advances candidate completion time; reversal chooses an older one. */
    kind: "selection" | "reversal";

    /** Production namespace owning the selection. */
    productionId: string;

    /** Shot whose active candidate is changed. */
    shot: string;

    /** Request identity copied from the admitted candidate receipt. */
    requestId: string;

    /** Attempt identity copied from the admitted candidate receipt. */
    attemptId: string;

    /** Authored event timestamp checked against candidate/lineage chronology. */
    selectedAt: string;

    /** Production-state relative immutable candidate receipt address. */
    candidateReceipt: string;

    /** Render-root relative selected candidate payload address. */
    output: string;

    /** Previous selection record address, null for the first active choice. */
    previousSelection: string | null;

    /** Trimmed author explanation for this choice. */
    reason: string;

    /** Trimmed author statement of structural review; no review-store binding is implied. */
    structuralReview: string;

    /** Required authored continuity assertions when a prior candidate supplies a baseline. */
    continuityReview: {
        /** Prior candidate output digest used as the comparison baseline. */
        baseline: string;

        /** Nonblank author reference to playback evidence. */
        playbackEvidence: string;

        /** Author reference for mixed delivery review, null when no mixed policy is claimed. */
        mixedDeliveryPolicy: string | null;

        /** Author assertion that reviewed playback has no unacceptable flicker. */
        flicker: "pass";

        /** Author assertion that identity remains acceptable across playback. */
        identityDrift: "pass";

        /** Author assertion that reviewed geometry deformation is acceptable. */
        geometryWarp: "pass";

        /** Author assertion that reviewed texture motion is acceptable. */
        textureCrawl: "pass";

        /** Author assertion that the reviewed transition matches the selected delivery. */
        transitionMismatch: "pass";
    } | null;
}
