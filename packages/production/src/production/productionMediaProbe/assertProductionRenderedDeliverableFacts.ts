import type { IAutoMovieProductionMediaProbe } from "@automovie/interface";

/**
 * Refuse a render-manifest kind/media mismatch or scalar tuple mismatch. Runtime is seconds, frame count belongs only to video, and codec/runtime/frameCount are null for sidecars or pictures except captions use the supplied current production runtime. Already admitted parser facts are required.
 *
 * @evidence contracts/common.md#principled-implementation The closed kind discriminant selects a supported video/audio/picture/caption/evidence association, derives its three-field tuple and uses exact scalar comparisons against the manifest.
 * @evidence contracts/common.md#clear-and-simple-design Association admission and tuple comparison stay in one bounded decision; media decoding and current caption-plan construction stay with the caller and parser.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null tuples reflect the real supported sidecar/picture protocol rather than hiding missing video facts. No floating-point tolerance or coercion rewrites committed parser values.
 * @evidence contracts/common.md#meaningful-documentation States parser-admitted input, seconds/count/codec meanings, caption runtime authority and thrown first-field refusal; final delivery timeline diagnostics supplies these facts.
 * @evidence contracts/performance.md#efficient-algorithms All kind decisions and three comparisons have constant field count; constructing a refusal formats only its involved scalar strings. No payload bytes, cue list or sample table is traversed here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The function coordinates no effectful work or cache; it consumes the caller's existing probe and compares this manifest row.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a fixed tuple and comparison array are allocated locally. It acquires no handles or tasks and retains neither the probe nor a successful verdict after return.
 */
export const assertProductionRenderedDeliverableFacts: (props: {

    /** Declared deliverable kind selecting the supported media association. */
    kind: "feature" | "guide-pass" | "preview" | "captions" | "audio-mix";

    /** Manifest runtime in seconds, or null where the kind carries no runtime fact. */
    runtimeSeconds: number | null;

    /** Manifest video frame count, or null for non-video records. */
    frameCount: number | null;

    /** Manifest codec identity, or null for a sidecar or picture. */
    codec: string | null;

    /** Current production runtime used for caption scalar closure, not derived from the last cue. */
    expectedCaptionRuntimeSeconds: number | null;

    /** Already parsed media facts; this function does not decode the payload again. */
    probe: IAutoMovieProductionMediaProbe;
}) => void = (props: {

    /** Declared deliverable kind selecting the supported media association. */
    kind: "feature" | "guide-pass" | "preview" | "captions" | "audio-mix";

    /** Manifest runtime in seconds, or null where the kind carries no runtime fact. */
    runtimeSeconds: number | null;

    /** Manifest video frame count, or null for non-video records. */
    frameCount: number | null;

    /** Manifest codec identity, or null for a sidecar or picture. */
    codec: string | null;

    /** Current production runtime used for caption scalar closure, not derived from the last cue. */
    expectedCaptionRuntimeSeconds: number | null;

    /** Already parsed media facts; this function does not decode the payload again. */
    probe: IAutoMovieProductionMediaProbe;
}): void => {
    const video: Extract<IAutoMovieProductionMediaProbe, {
        kind: "video";
    }> | null = props.kind === "feature" && props.probe.kind === "feature"
        ? props.probe.video
        : props.kind === "guide-pass" && props.probe.kind === "video"
            ? props.probe
            : null;
    const audio: Extract<IAutoMovieProductionMediaProbe, {
        kind: "audio";
    }> | null = props.kind === "audio-mix" && props.probe.kind === "audio"
        ? props.probe
        : null;
    const associationValid: boolean = video !== null ||
        audio !== null ||
        (props.kind === "audio-mix" && props.probe.kind === "sound-evidence") ||
        (props.kind === "preview" && props.probe.kind === "png") ||
        (props.kind === "captions" && props.probe.kind === "webvtt");
    if (associationValid === false)
        throw new Error(`Render manifest ${props.kind} cannot carry parser facts of kind ${props.probe.kind}.`);
    const expected: {
        runtimeSeconds: number | null;
        frameCount: number | null;
        codec: string | null;
    } = video !== null
        ? {
            runtimeSeconds: video.runtimeSeconds,
            frameCount: video.frameCount,
            codec: video.codec,
        }
        : audio !== null
            ? {
                runtimeSeconds: audio.runtimeSeconds,
                frameCount: null,
                codec: audio.codec,
            }
            : props.kind === "captions"
                ? {
                    runtimeSeconds: props.expectedCaptionRuntimeSeconds,
                    frameCount: null,
                    codec: null,
                }
                : { runtimeSeconds: null, frameCount: null, codec: null };
    const comparisons: Array<[
        string,
        unknown,
        unknown
    ]> = [
        ["runtimeSeconds", expected.runtimeSeconds, props.runtimeSeconds],
        ["frameCount", expected.frameCount, props.frameCount],
        ["codec", expected.codec, props.codec],
    ];
    const mismatch: [
        string,
        unknown,
        unknown
    ] | undefined = comparisons.find(([, wanted, observed]: [
        string,
        unknown,
        unknown
    ]): boolean => wanted !== observed);
    if (mismatch !== undefined)
        throw new Error(`Render manifest ${props.kind}.${mismatch[0]} must equal its parser-derived media fact: expected ${String(mismatch[1])}, observed ${String(mismatch[2])}.`);
};
