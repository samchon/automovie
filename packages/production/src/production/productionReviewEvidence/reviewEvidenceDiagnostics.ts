import { AutoMovieGuidePass, IAutoMovieDiagnostic, IAutoMovieRenderBundleManifest, IAutoMovieShotContract } from "@automovie/interface";
import { ProductionReviewEvidenceOwedView } from "./ProductionReviewEvidenceOwedView";
import { productionReviewEvidenceDescribeIncompleteCoverage } from "./productionReviewEvidenceDescribeIncompleteCoverage";
import { productionReviewEvidenceViewKey } from "./productionReviewEvidenceViewKey";
import { productionReviewEvidenceDescribeMissing } from "./productionReviewEvidenceDescribeMissing";

/**
 * In review/final scopes, report missing declared shot frame/pass observations at the supplied current target fingerprint. Typed admitted contracts require a positive finite production fps and valid duration/time domain. Callback-provided resident facts are trusted at this boundary; presence and complete mask coverage do not settle visual judgment.
 *
 * @evidence contracts/common.md#principled-implementation Expands each contract's declared frame/pass obligations, resolves both required and held times with round(time*fps) capped at floor(duration*fps), indexes eligible held pairs, and reports unmatched obligations in contract order. This binary64 formula reproduces oracle sampling rather than implementing an independent exact rational clock; graph admission supplies safe-frame times and this function adds no numeric guard. Masks count only with explicit zero-gap coverage.
 * @evidence contracts/common.md#clear-and-simple-design The diagnostic owner compares obligations and observations while callbacks own target fingerprinting and resident bundle admission. A nested clock mapping keeps required and observed identities on the same sampling formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No different pass, stale fingerprint lookup or incomplete mask substitutes for the required observation. Null fingerprint and an empty owed list are intentionally silent because another owner diagnoses unaddressable or missing design obligations; scalar input validation is not duplicated here.
 * @evidence contracts/common.md#meaningful-documentation Documents review/final scope, clock premise, exact pass, callback trust, zero-gap mask rule, preserved diagnostic order and the limit of pixel presence versus subjective review. reviewAutoMovieProductionBuild is the actual product caller.
 * @evidence contracts/performance.md#efficient-algorithms For R expanded obligations and H supplied captured views per shot, membership indexing and missing filtering use expected O(R+H) Set work plus string construction. Callbacks additionally fingerprint current content and reopen all resident bundles, including full frame/mask byte/parsing verification and frame-to-sidecar searches. Incomplete explanation scans H views and unresolved ids with sorting; sizes are not capped by this function.
 * @evidence contracts/performance.md#reuse-equivalent-work One captured result and held-pair Set serve this shot's checks and explanation. Mutable source/target identities are reobserved by callback owners rather than using a persistent review verdict across builds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources O(R+H) obligation, captured and membership populations are invocation-local per shot; diagnostics accumulate with missing shots and transfer to the caller. Callback readers own descriptors and payload temporaries; no renderer task, handle or persistent cache is created here.
 */
export const reviewEvidenceDiagnostics: (props: {

    /** Shot contracts the compiled production carries. */
    contracts: ReadonlyMap<string, IAutoMovieShotContract>;

    /** Production frame rate, which is the clock a declared time resolves on. */
    fps: number;

    /** Compile scope; only `review` and `final` owe pixels. */
    scope: "design" | "source" | "review" | "final";

    /**
     * Return the current target-local render fingerprint or null for an unaddressable target; current production uses productionRenderTargetFingerprint over exact target fields and relevant builder/content bytes.
     *
     * The callable contract preserves exact target kind/id/view input and nullable identity output; its provider owns current byte acquisition and canonical hashing.
     *
     * Identity derivation stays with the production render owner and review consumes this callback without a second hash algorithm.
     *
     * Null is not successful evidence and equal target names alone do not establish equivalent render inputs.
     *
     * Documents exact target identity, current-byte provider responsibility and nullable unaddressable result.
     *
     * This erased callable shape chooses no hashing or I/O algorithm; the provider's full target/content reads, canonicalization and hashing remain included in review cost.
     *
     * The signature stores no fingerprint cache; provider and builder own observation/equivalence across mutable inputs.
     *
     * The callable shape acquires no resource; its runtime provider/project own read lifetimes and the caller owns returned digest text.
     */
    fingerprint: (target: IAutoMovieRenderBundleManifest["target"]) => string | null;

    /**
     * Return resident admitted view facts under the exact target and requested fingerprint; the current project reader verifies canonical bundle addresses, receipts and every frame/sidecar byte before projection.
     *
     * The callback contract preserves requested target/fingerprint and all supplied view time/pass/optional coverage facts without asserting subjective review success.
     *
     * Resident bundle admission stays with project readers while review owns obligation membership and complete mask coverage policy.
     *
     * Historical files do not count merely because they exist; the current address and verified bundle/byte owners provide the premise, without a group-wide immutable snapshot promise.
     *
     * Documents resident-reader trust, exact discovery address, optional semantic coverage and caller-owned projected array.
     *
     * The erased signature selects no parser; provider directory enumeration, full PNG/mask reads and hashes, frame-to-sidecar scans and coverage clones remain part of review's delegated cost.
     *
     * The signature retains no completed work; current resident views are reobserved by provider rather than a type-level cache.
     *
     * It acquires no descriptors or bytes. Reader owns synchronous access/temporary payloads, and projected view arrays transfer to review callers without an independent population cap.
     */
    captured: (target: IAutoMovieRenderBundleManifest["target"], fingerprint: string) => ReadonlyArray<{

        /** Shot-local seconds resolved on the supplied production frame-rate clock. */
        time: number;

        /** Exact required render pass; another pass cannot discharge this obligation. */
        pass: AutoMovieGuidePass;

        /** Optional admitted runtime coverage; mask obligations require zero unresolved ids and zero unaddressed meshes. */
        semanticCoverage?: {

            /** Ordered runtime unresolved identifiers preserved by the receipt owner. */
            unresolved: string[];

            /** Non-negative safe integer runtime mesh count not addressed by the palette. */
            unaddressed: number;
        };
    }>;
}) => IAutoMovieDiagnostic[] = (props: {

    /** Shot contracts the compiled production carries. */
    contracts: ReadonlyMap<string, IAutoMovieShotContract>;

    /** Production frame rate, which is the clock a declared time resolves on. */
    fps: number;

    /** Compile scope; only `review` and `final` owe pixels. */
    scope: "design" | "source" | "review" | "final";

    /**
     * Return the current target-local render fingerprint or null for an unaddressable target; current production uses productionRenderTargetFingerprint over exact target fields and relevant builder/content bytes.
     *
     * The callable contract preserves exact target kind/id/view input and nullable identity output; its provider owns current byte acquisition and canonical hashing.
     *
     * Identity derivation stays with the production render owner and review consumes this callback without a second hash algorithm.
     *
     * Null is not successful evidence and equal target names alone do not establish equivalent render inputs.
     *
     * Documents exact target identity, current-byte provider responsibility and nullable unaddressable result.
     *
     * This erased callable shape chooses no hashing or I/O algorithm; the provider's full target/content reads, canonicalization and hashing remain included in review cost.
     *
     * The signature stores no fingerprint cache; provider and builder own observation/equivalence across mutable inputs.
     *
     * The callable shape acquires no resource; its runtime provider/project own read lifetimes and the caller owns returned digest text.
     */
    fingerprint: (target: IAutoMovieRenderBundleManifest["target"]) => string | null;

    /**
     * Return resident admitted view facts under the exact target and requested fingerprint; the current project reader verifies canonical bundle addresses, receipts and every frame/sidecar byte before projection.
     *
     * The callback contract preserves requested target/fingerprint and all supplied view time/pass/optional coverage facts without asserting subjective review success.
     *
     * Resident bundle admission stays with project readers while review owns obligation membership and complete mask coverage policy.
     *
     * Historical files do not count merely because they exist; the current address and verified bundle/byte owners provide the premise, without a group-wide immutable snapshot promise.
     *
     * Documents resident-reader trust, exact discovery address, optional semantic coverage and caller-owned projected array.
     *
     * The erased signature selects no parser; provider directory enumeration, full PNG/mask reads and hashes, frame-to-sidecar scans and coverage clones remain part of review's delegated cost.
     *
     * The signature retains no completed work; current resident views are reobserved by provider rather than a type-level cache.
     *
     * It acquires no descriptors or bytes. Reader owns synchronous access/temporary payloads, and projected view arrays transfer to review callers without an independent population cap.
     */
    captured: (target: IAutoMovieRenderBundleManifest["target"], fingerprint: string) => ReadonlyArray<{

        /** Shot-local seconds resolved on the supplied production frame-rate clock. */
        time: number;

        /** Exact required render pass; another pass cannot discharge this obligation. */
        pass: AutoMovieGuidePass;

        /** Optional admitted runtime coverage; mask obligations require zero unresolved ids and zero unaddressed meshes. */
        semanticCoverage?: {

            /** Ordered runtime unresolved identifiers preserved by the receipt owner. */
            unresolved: string[];

            /** Non-negative safe integer runtime mesh count not addressed by the palette. */
            unaddressed: number;
        };
    }>;
}): IAutoMovieDiagnostic[] => {
    if (props.scope !== "review" && props.scope !== "final")
        return [];
    const diagnostics: IAutoMovieDiagnostic[] = [];
    for (const [id, contract] of props.contracts) {
        const target: Extract<IAutoMovieRenderBundleManifest["target"], {
            kind: "shot";
        }> = { kind: "shot", id } as const;
        const fingerprint: string | null = props.fingerprint(target);
        if (fingerprint === null)
            continue;
        const owed: ProductionReviewEvidenceOwedView[] = contract.reviewFrames.flatMap((frame: IAutoMovieShotContract["reviewFrames"][number]): ProductionReviewEvidenceOwedView[] => frame.passes.map((pass: AutoMovieGuidePass): ProductionReviewEvidenceOwedView => ({ frame: frame.id, time: frame.time, pass })));
        if (owed.length === 0)
            continue;
        /**
         * Resolve one already admitted shot-local time to the production clock, capped at the owning contract's final integer frame.
         *
         * Math.round(time*fps) matches capture sampling and Math.floor(duration*fps) defines the final frame; valid finite non-negative times, duration and positive fps are caller admission premises.
         *
         * One closure applies identical clock mapping to held and owed views within this contract.
         *
         * No tolerance, special frame or pass substitution is used; this helper does not independently admit malformed clock values or prove a capture actually occurred.
         *
         * Documents seconds versus integer index, duration cap and captured contract/clock values.
         *
         * A fixed number of arithmetic operations is O(1), without visiting frame lists or payload bytes.
         *
         * The pure invocation-local clock mapping stores no completed/in-flight request or cache.
         *
         * The closure borrows this contract/fps until the review call finishes and acquires no handles, buffers or tasks.
         */
        const snap: (time: number) => number = (time: number): number => Math.min(Math.round(time * props.fps), Math.floor(contract.durationSeconds * props.fps));
        const captured: ReturnType<Parameters<typeof reviewEvidenceDiagnostics>[0]["captured"]> = props.captured(target, fingerprint);
        const held: Set<string> = new Set(captured
            .filter((view: ReturnType<Parameters<typeof reviewEvidenceDiagnostics>[0]["captured"]>[number]): boolean => view.pass !== "mask" ||
            (view.semanticCoverage !== undefined &&
                view.semanticCoverage.unresolved.length === 0 &&
                view.semanticCoverage.unaddressed === 0))
            .map((view: ReturnType<Parameters<typeof reviewEvidenceDiagnostics>[0]["captured"]>[number]): string => productionReviewEvidenceViewKey(snap(view.time), view.pass)));
        const missing: ProductionReviewEvidenceOwedView[] = owed.filter((view: ReturnType<Parameters<typeof reviewEvidenceDiagnostics>[0]["captured"]>[number]): boolean => held.has(productionReviewEvidenceViewKey(snap(view.time), view.pass)) === false);
        if (missing.length === 0)
            continue;
        diagnostics.push({
            code: "review-evidence-missing",
            category: "error",
            phase: "review",
            target: `shot:${id}`,
            path: null,
            message: `Shot "${id}" is being reviewed without the evidence its own contract declares. ${productionReviewEvidenceDescribeMissing(missing)}${productionReviewEvidenceDescribeIncompleteCoverage(captured)} Evidence is read at this shot's current fingerprint ${fingerprint}, so a frame drawn before the shot last moved is still on disk and still does not count. Capture what is named above, then say what it showed in the evidence citation on the source that realizes this shot.`,
        });
    }
    return diagnostics;
};
