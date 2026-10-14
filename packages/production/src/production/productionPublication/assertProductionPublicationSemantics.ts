import { SHA256_DIGEST_PATTERN, resolveProductionFrameRate } from "@automovie/engine";
import type { IAutoMovieProductionPublicationIdentity } from "@automovie/interface";
import { resolveProductionRenderTierFrameFormat } from "@automovie/render";
import { canonicalAutoMovieCaptureRuntimeIdentity } from "../canonicalAutoMovieCaptureRuntimeIdentity";
import { productionPublicationNonBlank } from "./productionPublicationNonBlank";
import { productionPublicationSameCanonicalJson } from "./productionPublicationSameCanonicalJson";

/**
 * Admit names, digest syntax, format projection and partitions of the declared publication chunk series.
 *
 * @evidence contracts/common.md#principled-implementation Shape admission precedes this caller; capture identity and frame-rate owners check their domains, then slot/id uniqueness and each declared deliverable's contiguous half-open partition are checked in input order.
 * @evidence contracts/common.md#clear-and-simple-design Stored publication parsing delegates cross-field metadata admission here, independently of media decoding or host capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Checks every declared series through totalFrames but does not require a feature series or a nonempty chunk population. Current-publication admission separately compares the actual plan, and metadata claims alone are no physical proof.
 * @evidence contracts/common.md#meaningful-documentation Defines trimmed names, positive safe extents, case-insensitive slot uniqueness, exact chunk-id uniqueness and the declared-series scope.
 * @evidence contracts/performance.md#efficient-algorithms Traverses C chunks and their name/digest text, indexes slots/ids/series, and includes capture/format validation plus canonical tier comparison; this stage does not traverse the original full frame mapping.
 * @evidence contracts/performance.md#reuse-equivalent-work One series map carries the previous endpoint for each deliverable, and shared domain validators avoid duplicate projection policies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Sets/maps expire after the synchronous check, retaining only supplied strings per declared population; no descriptors, pixel buffers or tasks are acquired.
 */
export const assertProductionPublicationSemantics: (identity: IAutoMovieProductionPublicationIdentity) => void = (identity: IAutoMovieProductionPublicationIdentity): void => {
    const runtime: IAutoMovieProductionPublicationIdentity["runtimeIdentity"] = identity.runtimeIdentity;
    if (productionPublicationNonBlank(identity.productionId) === false ||
        productionPublicationNonBlank(runtime.encoder.package) === false ||
        productionPublicationNonBlank(runtime.encoder.version) === false)
        throw new Error("Production publication identity names a blank production or encoder package.");
    if ([
        identity.compileFingerprint,
        identity.editFingerprint,
        runtime.sourceDigest,
        ...(runtime.dialogueRuntimeIdentity === null
            ? []
            : [runtime.dialogueRuntimeIdentity]),
        runtime.encoder.closureDigest,
        identity.tracks.captions,
        identity.tracks.audio,
        identity.tracks.audioAssets,
        identity.tracks.effects,
    ].some((value: string): boolean => SHA256_DIGEST_PATTERN.test(value) === false))
        throw new Error("Production publication identity carries a malformed content digest.");
    canonicalAutoMovieCaptureRuntimeIdentity(runtime.capture);
    for (const format of [identity.sourceFrameFormat, identity.frameFormat]) {
        if (Number.isSafeInteger(format.width) === false ||
            format.width <= 0 ||
            Number.isSafeInteger(format.height) === false ||
            format.height <= 0)
            throw new Error("Production publication frame format raster is not a positive integer size.");
        resolveProductionFrameRate(format);
    }
    if (productionPublicationSameCanonicalJson(identity.frameFormat, resolveProductionRenderTierFrameFormat(identity.sourceFrameFormat, identity.tier)) === false)
        throw new Error("Production publication frame format is not the tier projection of its source frame format.");
    if (Number.isSafeInteger(identity.totalFrames) === false ||
        identity.totalFrames <= 0 ||
        Number.isSafeInteger(identity.chunkFrames) === false ||
        identity.chunkFrames <= 0)
        throw new Error("Production publication frame or chunk extent is invalid.");
    const slots: Set<string> = new Set<string>();
    const ids: Set<string> = new Set<string>();
    const series: Map<string, {
        kind: "feature" | "guide-pass";
        pass: string;
        end: number;
    }> = new Map<string, {
        kind: "feature" | "guide-pass";
        pass: string;
        end: number;
    }>();
    for (const chunk of identity.chunks) {
        if (productionPublicationNonBlank(chunk.slot) === false ||
            productionPublicationNonBlank(chunk.deliverable) === false ||
            SHA256_DIGEST_PATTERN.test(chunk.id) === false ||
            SHA256_DIGEST_PATTERN.test(chunk.frames) === false ||
            (chunk.kind === "feature") !== (chunk.pass === "beauty") ||
            slots.has(chunk.slot.toLowerCase()) ||
            ids.has(chunk.id))
            throw new Error("Production publication chunk identity is malformed, duplicated, or pairs a deliverable kind with a foreign pass.");
        slots.add(chunk.slot.toLowerCase());
        ids.add(chunk.id);
        const previous: {
            kind: "feature" | "guide-pass";
            pass: string;
            end: number;
        } = series.get(chunk.deliverable) ?? {
            kind: chunk.kind,
            pass: chunk.pass,
            end: 0,
        };
        const span: number = chunk.frameEndExclusive - chunk.frameStart;
        if (previous.kind !== chunk.kind ||
            previous.pass !== chunk.pass ||
            chunk.frameStart !== previous.end ||
            Number.isSafeInteger(chunk.frameEndExclusive) === false ||
            span <= 0 ||
            span > identity.chunkFrames ||
            (span < identity.chunkFrames &&
                chunk.frameEndExclusive !== identity.totalFrames) ||
            chunk.frameEndExclusive > identity.totalFrames)
            throw new Error(`Production publication chunk "${chunk.slot}" does not continue one exact partition of its deliverable's planned extent.`);
        series.set(chunk.deliverable, {
            kind: chunk.kind,
            pass: chunk.pass,
            end: chunk.frameEndExclusive,
        });
    }
    for (const [deliverable, state] of series)
        if (state.end !== identity.totalFrames)
            throw new Error(`Production publication deliverable "${deliverable}" chunks stop at frame ${state.end} of ${identity.totalFrames}.`);
};
