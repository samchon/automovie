

/**
 * Result of contextual caption and sound evidence comparison: absent means no verified observation at this boundary, including optional missing caption bytes; verified means comparison against supplied current owners passed, not visual, linguistic or listening approval.
 *
 * @evidence contracts/common.md#principled-implementation Two closed field unions summarize independent current caption and sound obligations after their runtime verifiers succeed.
 * @evidence contracts/common.md#clear-and-simple-design The result carries comparison outcomes only; full plan, audio identity and evidence remain with their canonical owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No verified state is synthesized for missing required caption or mismatched sound evidence; the type itself establishes no byte provenance.
 * @evidence contracts/common.md#meaningful-documentation Documents optional absence versus verified comparison and the limits of these outcomes; consumers still require earlier byte/receipt admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased result interface chooses no algorithm; UTF-8/schema/canonical JSON work belongs to the verifier that constructs it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It stores no equivalent work or proof cache; current-plan comparison occurs at the runtime boundary.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resources. Its runtime producer allocates a two-field record whose lifetime belongs to the caller; it retains no media bytes.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionNonVideoVerification {

    /** Absent includes an optional missing file; verified means decoded caption text matched the supplied current plan. */
    caption: "absent" | "verified";

    /** Absent means no sound obligation was supplied; verified means full evidence matched the supplied current sound owners. */
    sound: "absent" | "verified";
}
