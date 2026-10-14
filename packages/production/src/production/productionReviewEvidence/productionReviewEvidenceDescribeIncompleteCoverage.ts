import { AutoMovieGuidePass } from "@automovie/interface";
import { compareCodeUnits } from "../contentIdentity";

/**
 * Explain captured mask observations with actual nonzero runtime gaps, preserving the sorted union of unresolved ids and maximum unaddressed mesh count. Typed coverage is already admitted by the resident reader; missing coverage is handled as a missing obligation by the caller.
 *
 * @evidence contracts/common.md#principled-implementation Filters explicit incomplete mask records, unions their unresolved identifiers with a Set, sorts by code units and folds the scalar maximum with fixed two-argument Math.max calls. The nonempty admitted finite count population preserves the same maximum without a variadic argument limit; no visible scene judgment or prose quality grading occurs.
 * @evidence contracts/common.md#clear-and-simple-design One explanation helper augments the ordinary missing-view diagnostic without changing whether any mask obligation was discharged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A complete or non-mask observation contributes no gap explanation, and unresolved identities/counts are not discarded or changed to produce an accepted review.
 * @evidence contracts/common.md#meaningful-documentation Documents reader-admitted coverage, actual unresolved union, maximum rather than summed unnamed-mesh count, and empty explanation when no explicit incomplete mask exists.
 * @evidence contracts/performance.md#efficient-algorithms For H captured views, U unresolved occurrences and Q unique ids, filtering/union costs expected O(H+U), sorting costs Q log Q string comparisons, and the scalar maximum visits incomplete records without a mapped count array or variadic argument vector. Output text retains all Q ids, with no observation or character quota imposed.
 * @evidence contracts/performance.md#reuse-equivalent-work The filtered incomplete list supplies both unresolved union and maximum computation; no explanation is cached across changing captured views.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Incomplete-reference array, Set, sorted ids and output text grow with H/U/Q and are invocation-local or transferred as returned text. No handles or tasks are acquired and no observation/text quota is imposed.
 */
export const productionReviewEvidenceDescribeIncompleteCoverage: (captured: ReadonlyArray<{

    /** Exact required render pass; another pass cannot discharge this obligation. */
    pass: AutoMovieGuidePass;

    /** Optional admitted runtime coverage; mask obligations require zero unresolved ids and zero unaddressed meshes. */
    semanticCoverage?: {

        /** Ordered runtime unresolved identifiers preserved by the receipt owner. */
        unresolved: string[];

        /** Non-negative safe integer runtime mesh count not addressed by the palette. */
        unaddressed: number;
    };
}>) => string = (captured: ReadonlyArray<{

    /** Exact required render pass; another pass cannot discharge this obligation. */
    pass: AutoMovieGuidePass;

    /** Optional admitted runtime coverage; mask obligations require zero unresolved ids and zero unaddressed meshes. */
    semanticCoverage?: {

        /** Ordered runtime unresolved identifiers preserved by the receipt owner. */
        unresolved: string[];

        /** Non-negative safe integer runtime mesh count not addressed by the palette. */
        unaddressed: number;
    };
}>): string => {
    const incomplete: typeof captured[number][] = captured.filter((view: typeof captured[number]): boolean => view.pass === "mask" &&
        view.semanticCoverage !== undefined &&
        (view.semanticCoverage.unresolved.length !== 0 ||
            view.semanticCoverage.unaddressed !== 0));
    if (incomplete.length === 0)
        return "";
    const unresolved: string[] = [
        ...new Set(incomplete.flatMap((view: typeof captured[number]): string[] => view.semanticCoverage!.unresolved)),
    ].sort(compareCodeUnits);
    let unaddressed: number = Number.NEGATIVE_INFINITY;
    for (const view of incomplete)
        unaddressed = Math.max(unaddressed, view.semanticCoverage!.unaddressed);
    return ` Current mask evidence remains incomplete: unresolved ids [${unresolved.join(", ")}] and ${unaddressed} unnamed meshes.`;
};
