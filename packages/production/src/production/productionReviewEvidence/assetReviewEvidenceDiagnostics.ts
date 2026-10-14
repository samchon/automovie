import { AutoMovieGuidePass, IAutoMovieDiagnostic, IAutoMovieRenderBundleManifest } from "@automovie/interface";
import { autoMovieAssetReviewViews } from "../autoMovieAssetReviewViews";

/**
 * For each actually consumed model in review/final scope, require every current contract view with its exact pass, including the rigged model's extra range-of-motion pose. Null fingerprints are unaddressable and skipped; all-unaddressable assets are silent here, and visible asset quality remains a separate judgment.
 *
 * @evidence contracts/common.md#principled-implementation The existing view generator defines each angle/elevation/pose/pass. Current fingerprint and resident-view callbacks are invoked for every view, and pass equality determines whether that exact addressed view is held.
 * @evidence contracts/common.md#clear-and-simple-design The retained view generator supplies descriptors to this review coverage check; it aggregates missing names while the builder and project providers own rig state, target hashing and resident byte admission. No frame or turntable capture producer is invoked here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Beauty cannot discharge outline, and unused design recipes are not taxed with a turntable obligation. Typed callback facts and admitted model identities are required; no capture is synthesized or host modified.
 * @evidence contracts/common.md#meaningful-documentation Documents scope, consumed-model premise, exact view/pass correspondence, rig-dependent set, null-address behavior and ordered per-model diagnostics. The builder supplies consumedModelIds, compiled rig checks and project captured-view readers.
 * @evidence contracts/performance.md#efficient-algorithms For A consumed models and fixed V=9 or 10 views, loops add O(A*V) callback dispatch and held-pass scans. Each current fingerprint reads/hashes relevant content, each resident lookup reopens all selected bundle frames/sidecars and parses their bytes, and rig admission reads/schema-validates the compiled model; delegated cost and captured populations remain included and uncapped here.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the one shared contract view generator, with each view's returned resident list reused for its pass test. Different views are distinct render identities; no cross-build cached success is inferred from an asset id or quiet filesystem.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One model's missing-view strings and callback temporaries are local; diagnostics grow with missing consumed models and transfer to the caller. Resident readers own descriptors and payload buffers, and this function starts no capture promise or persistent queue.
 */
export const assetReviewEvidenceDiagnostics: (props: {

    /** Model ids some shot, formation, or compiled shot source consumes. */
    consumed: readonly string[];

    /**
     * Determine whether the current compiled model has a skeleton and therefore owes the additional range-of-motion view; the builder's provider catches unreadable/invalid models as false while their owning registry/model diagnostics remain separate.
     *
     * This typed model-id predicate supplies the rig decision used by the shared fixed asset review view generator.
     *
     * Compiled model byte/schema reading remains with the builder's provider rather than the view coverage diagnostic.
     *
     * The callable shape itself cannot prove readable model provenance; false is not a fabricated frame or a successful rig inspection.
     *
     * Documents current skeleton criterion and provider refusal limitation so the view selector is not mistaken for independent model admission.
     *
     * The erased callback contract chooses no reader/parser algorithm; provider generated-file acquisition and complete JSON/model schema validation remain part of aggregate asset review cost.
     *
     * No compiled-model cache is stored by this callable shape; runtime provider controls observation of current generated ownership.
     *
     * The signature acquires no handle or task. Project reader owns bytes/access and only the scalar result reaches the view generator.
     */
    rigged: (model: string) => boolean;

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
    }>;
}) => IAutoMovieDiagnostic[] = (props: {

    /** Model ids some shot, formation, or compiled shot source consumes. */
    consumed: readonly string[];

    /**
     * Determine whether the current compiled model has a skeleton and therefore owes the additional range-of-motion view; the builder's provider catches unreadable/invalid models as false while their owning registry/model diagnostics remain separate.
     *
     * This typed model-id predicate supplies the rig decision used by the shared fixed asset review view generator.
     *
     * Compiled model byte/schema reading remains with the builder's provider rather than the view coverage diagnostic.
     *
     * The callable shape itself cannot prove readable model provenance; false is not a fabricated frame or a successful rig inspection.
     *
     * Documents current skeleton criterion and provider refusal limitation so the view selector is not mistaken for independent model admission.
     *
     * The erased callback contract chooses no reader/parser algorithm; provider generated-file acquisition and complete JSON/model schema validation remain part of aggregate asset review cost.
     *
     * No compiled-model cache is stored by this callable shape; runtime provider controls observation of current generated ownership.
     *
     * The signature acquires no handle or task. Project reader owns bytes/access and only the scalar result reaches the view generator.
     */
    rigged: (model: string) => boolean;

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
    }>;
}): IAutoMovieDiagnostic[] => {
    if (props.scope !== "review" && props.scope !== "final")
        return [];
    const diagnostics: IAutoMovieDiagnostic[] = [];
    for (const model of props.consumed) {
        const missing: string[] = [];
        let addressable: boolean = false;
        for (const view of autoMovieAssetReviewViews({
            rigged: props.rigged(model),
        })) {
            const target: Extract<IAutoMovieRenderBundleManifest["target"], {
                kind: "asset";
            }> = {
                kind: "asset",
                id: model,
                angleDeg: view.angleDeg,
                elevationDeg: view.elevationDeg,
                pose: view.pose,
            } as const;
            const fingerprint: string | null = props.fingerprint(target);
            if (fingerprint === null)
                continue;
            addressable = true;
            // A held view counts only at its required pass; angle identity alone cannot discharge an outline obligation.
            if (props
                .captured(target, fingerprint)
                .some((held: ReturnType<Parameters<typeof assetReviewEvidenceDiagnostics>[0]["captured"]>[number]): boolean => held.pass === view.pass) === false)
                missing.push(`"${view.id}" (${view.pass})`);
        }
        if (addressable === false || missing.length === 0)
            continue;
        diagnostics.push({
            code: "review-evidence-missing",
            category: "error",
            phase: "review",
            target: `asset:${model}`,
            path: null,
            message: `Model "${model}" is staged by this production and is being reviewed without the turntable views an asset review is judged from. Missing ${missing.join(", ")}. An object read from one flattering angle is an object whose other side nobody looked at. Capture the declared set, then say what each view showed in the evidence citation on this model's design owner.`,
        });
    }
    return diagnostics;
};
