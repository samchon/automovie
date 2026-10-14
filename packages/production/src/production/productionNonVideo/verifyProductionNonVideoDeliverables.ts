import type { IAutoMovieProductionSoundAnalysis, IAutoMovieProductionSoundEvidence, IAutoMovieProductionSoundEvidenceAudio, IAutoMovieProductionSoundPlan, IAutoMovieProductionTtsReceipt } from "@automovie/interface";
import { canonicalizeAutoMovieJson } from "../contentIdentity";
import { IAutoMovieProductionNonVideoVerification } from "./IAutoMovieProductionNonVideoVerification";
import { parseProductionSoundEvidence } from "./parseProductionSoundEvidence";
import { productionNonVideoDecodeUtf8 } from "./productionNonVideoDecodeUtf8";

/**
 * Compare caption decoded UTF-8 text and complete sound evidence with supplied current semantic owners after outer byte/receipt gates. Strict TextDecoder uses its default BOM handling, so this caption comparison is decoded text equality rather than raw byte equality. Sound comparison does not synthesize TTS, decode sibling audio or remeasure PCM.
 *
 * @evidence contracts/common.md#principled-implementation Required absent captions refuse; present bytes decode and compare exactly with current WebVTT text. Sound bytes first pass complete schema ingress, then canonical JSON compares the full current plan, analysis, ordered TTS receipts, sibling audio identity and fixed pre-encode measurement protocol.
 * @evidence contracts/common.md#clear-and-simple-design Independent caption/sound branches return two outcome fields; duplicate-aware JSON, UTF-8 decoding and canonical JSON retain existing owners instead of a second publication parser.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No semantic aggregate substitutes for prior actual file byte identity. Optional absent captions remain absent, BOM decoding follows the actual public decoder API, and malformed or unequal evidence throws rather than producing verified.
 * @evidence contracts/common.md#meaningful-documentation Documents null optional obligations, required caption behavior, decoded-text semantics, full sound owner equality and the external byte/provenance prerequisites. Delivery timeline and sound publication callers provide those current owners.
 * @evidence contracts/performance.md#efficient-algorithms Caption work scales with decoded B bytes/text; sound bytes include duplicate-aware parsing with a value-dispatch depth limit of 256 and full schema traversal. Canonical JSON of supplied actual/expected records visits encoded object occurrences and string units, with per-object K log K key sorting, repeated shared subgraphs, recursion and output strings; canonical encoding and payload size have no independent quota here, and no strict linear aggregate bound is claimed.
 * @evidence contracts/performance.md#reuse-equivalent-work One parsed sound record and one current expected record serve their canonical comparison; TTS order is copied once. No cross-plan or cross-file success cache assumes observations or mutable owner records remain equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Decoded caption text, expected TTS array, schema records and both canonical JSON strings coexist locally through success or throw, while input bytes/owner graphs remain borrowed. The returned two-field result retains no payload and no file handle or asynchronous task is acquired.
 */
export const verifyProductionNonVideoDeliverables: (props: {

    /** Optional current caption obligation and decoded text comparison inputs. */
    caption: {

        /** Whether missing caption bytes must refuse rather than remain absent. */
        required: boolean;

        /** Current canonical caption text to compare after strict UTF-8 decoding. */
        expected: string;

        /** Reopened caption bytes, or null when no file was supplied. */
        actual: Uint8Array | null;
    } | null;

    /** Optional current sound owners and the complete evidence record or JSON bytes. */
    sound: {

        /** Current authored sound plan compared as complete canonical JSON. */
        expectedPlan: IAutoMovieProductionSoundPlan;

        /** Current pre-encode PCM analysis compared as complete canonical JSON. */
        expectedAnalysis: IAutoMovieProductionSoundAnalysis;

        /** Ordered current TTS receipts; their order and full records remain significant. */
        expectedTts: readonly IAutoMovieProductionTtsReceipt[];

        /** Sibling encoded audio identity compared without decoding or synthesizing audio. */
        expectedAudio: IAutoMovieProductionSoundEvidenceAudio;

        /** Complete sound evidence record or strict JSON bytes compared with the supplied current sound owners. */
        evidence: IAutoMovieProductionSoundEvidence | Uint8Array;
    } | null;
}) => IAutoMovieProductionNonVideoVerification = (props: {

    /** Optional current caption obligation and decoded text comparison inputs. */
    caption: {

        /** Whether missing caption bytes must refuse rather than remain absent. */
        required: boolean;

        /** Current canonical caption text to compare after strict UTF-8 decoding. */
        expected: string;

        /** Reopened caption bytes, or null when no file was supplied. */
        actual: Uint8Array | null;
    } | null;

    /** Optional current sound owners and the complete evidence record or JSON bytes. */
    sound: {

        /** Current authored sound plan compared as complete canonical JSON. */
        expectedPlan: IAutoMovieProductionSoundPlan;

        /** Current pre-encode PCM analysis compared as complete canonical JSON. */
        expectedAnalysis: IAutoMovieProductionSoundAnalysis;

        /** Ordered current TTS receipts; their order and full records remain significant. */
        expectedTts: readonly IAutoMovieProductionTtsReceipt[];

        /** Sibling encoded audio identity compared without decoding or synthesizing audio. */
        expectedAudio: IAutoMovieProductionSoundEvidenceAudio;

        /** Complete sound evidence record or strict JSON bytes compared with the supplied current sound owners. */
        evidence: IAutoMovieProductionSoundEvidence | Uint8Array;
    } | null;
}): IAutoMovieProductionNonVideoVerification => {
    let caption: IAutoMovieProductionNonVideoVerification["caption"] = "absent";
    if (props.caption !== null) {
        if (props.caption.actual === null) {
            if (props.caption.required)
                throw new Error("Required current caption bytes are absent.");
        }
        else {
            const actual: string = productionNonVideoDecodeUtf8(props.caption.actual, "Caption");
            if (actual !== props.caption.expected)
                throw new Error("Caption bytes differ from the complete current canonical WebVTT plan.");
            caption = "verified";
        }
    }
    let sound: IAutoMovieProductionNonVideoVerification["sound"] = "absent";
    if (props.sound !== null) {
        const actual: IAutoMovieProductionSoundEvidence = props.sound.evidence instanceof Uint8Array
            ? parseProductionSoundEvidence(props.sound.evidence)
            : props.sound.evidence;
        const expected: IAutoMovieProductionSoundEvidence = {
            version: 2,
            plan: props.sound.expectedPlan,
            analysis: props.sound.expectedAnalysis,
            tts: [...props.sound.expectedTts],
            audio: props.sound.expectedAudio,
            measurement: {
                source: "pre-encode-pcm",
                algorithm: "automovie-production-sound-analysis-v1",
            },
        };
        let actualJson: string;
        let expectedJson: string;
        try {
            actualJson = canonicalizeAutoMovieJson(actual);
            expectedJson = canonicalizeAutoMovieJson(expected);
        }
        catch (error) {
            // Report canonicalization failures at the sound evidence boundary.
            throw new Error(`Sound evidence contains a non-finite or non-JSON value: ${(error as Error).message}`);
        }
        if (actualJson !== expectedJson)
            throw new Error("Sound evidence differs from the complete current plan, analysis, TTS receipts, sibling audio identity, or measurement provenance.");
        sound = "verified";
    }
    return { caption, sound };
};
