import { AutoMovieGuidePass } from "@automovie/interface";

/**
 * One admitted contract obligation: its review-frame identifier, shot-local seconds and exact required pass. Runtime frame-index resolution happens in the review diagnostic owner, not in this carrier.
 *
 * @evidence contracts/common.md#principled-implementation The three fields preserve review-frame/pass expansion without replacing authored time by a rounded value in the diagnostic explanation.
 * @evidence contracts/common.md#clear-and-simple-design A small carrier names each owed pair shared by missing-view detection and explanation, with no new review policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No observed frame or successful coverage is inferred by assigning this interface; contract and captured-view owners provide those facts separately.
 * @evidence contracts/common.md#meaningful-documentation Documents authored seconds, exact pass and display identifier; valid clock/time constraints remain premises supplied by design admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface chooses no expansion, lookup or sampling algorithm; its producer and diagnostic consumers own those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It stores no completed or in-flight work and has no review cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no resources; caller-owned obligation arrays retain its scalar/string fields only for the review operation.
 *
 * @author Samchon
 */
export interface ProductionReviewEvidenceOwedView {

    /** Exact contract review-frame identifier used when naming missing obligations. */
    frame: string;

    /** Shot-local seconds resolved on the supplied production frame-rate clock. */
    time: number;

    /** Exact required render pass; another pass cannot discharge this obligation. */
    pass: AutoMovieGuidePass;
}
