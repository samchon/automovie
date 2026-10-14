import { AutoMovieGuidePass, IAutoMovieCompiledFilmEffect, IAutoMovieFilmTimeline, IAutoMovieProductionDesign } from "@automovie/interface";
import { type IAutoMovieProductionAudioAssetIdentity, type IAutoMovieProductionRenderJobPlan, type IAutoMovieProductionRenderRuntimeIdentity, planProductionRenderJob } from "@automovie/render";
import { canonicalizeAutoMovieJson } from "./contentIdentity";

/**
 * Compare a stored plan with a fresh plan derived from the supplied current inputs.
 *
 * @evidence contracts/common.md#principled-implementation Replans with the stored tier/chunk extent and supplied timeline/effects/design/runtime/assets, then compares canonical JSON. Caller-supplied current inputs must be truthful; this does not itself acquire them.
 * @evidence contracts/common.md#clear-and-simple-design The render package owns planning and canonical JSON owns equality; this capability currently has no live application caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An old slot or matching fingerprint cannot bypass complete plan comparison; no filesystem or capture observation is fabricated.
 * @evidence contracts/common.md#meaningful-documentation Defines current-input premises, reproduced planning options and unchanged throw-on-difference behavior.
 * @evidence contracts/performance.md#efficient-algorithms Includes all planner traversals/identity work and full serialization of both plans; plan, frame/layer/track populations and serialized text dominate allocation and time.
 * @evidence contracts/performance.md#reuse-equivalent-work One rebuilt expected plan is compared once; no cross-request cache assumes mutable inputs remained equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two complete plans and canonical strings can coexist until return/refusal, without a fixed byte cap; no descriptor or task is acquired.
 */
export function verifyProductionRenderJobPlan(props: {
    /** Stored plan, including the tier and chunk extent reproduced for comparison. */
    plan: IAutoMovieProductionRenderJobPlan;

    /** Current builder-owned film timeline supplied by the caller. */
    timeline: IAutoMovieFilmTimeline;

    /** Current compiled film effects supplied in their authored order. */
    effects: readonly IAutoMovieCompiledFilmEffect[];

    /** Current production graph supplying design and delivery requirements. */
    production: IAutoMovieProductionDesign;

    /** Current render runtime content identity; this function does not acquire it. */
    runtimeIdentity: IAutoMovieProductionRenderRuntimeIdentity;

    /** Current shot-source fingerprints keyed by shot id. */
    sourceFingerprints: Readonly<Record<string, string>>;

    /** Current audio asset content facts used by the render planner. */
    audioAssets: readonly IAutoMovieProductionAudioAssetIdentity[];

    /** Optional guide selection; omission preserves the planner's normal default. */
    guidePasses?: readonly Exclude<AutoMovieGuidePass, "beauty">[];
}): void {
    const expected: IAutoMovieProductionRenderJobPlan = planProductionRenderJob({
        timeline: props.timeline,
        effects: props.effects,
        production: props.production,
        runtimeIdentity: props.runtimeIdentity,
        sourceFingerprints: props.sourceFingerprints,
        audioAssets: props.audioAssets,
        chunkFrames: props.plan.chunkFrames,
        guidePasses: props.guidePasses,
        tier: props.plan.tier,
    });
    if (canonicalizeAutoMovieJson(props.plan) !==
        canonicalizeAutoMovieJson(expected))
        throw new Error("Stored render plan differs from the current builder-owned timeline and render inputs. Replan from the current inputs, then rerender only changed chunk identities.");
}
