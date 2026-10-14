import { verifyAutoMovieSemanticMask } from "@automovie/engine";
import type { IAutoMovieProductionDeliverable, IAutoMovieProductionMediaProbe, IAutoMovieSemanticMask } from "@automovie/interface";
import { probeProductionRenderedMedia } from "@automovie/render/node";
import { AUTOMOVIE_SEMANTIC_MASK_MEDIA_TYPE } from "../AUTOMOVIE_SEMANTIC_MASK_MEDIA_TYPE";
import { parseAutoMovieStructuredJson } from "../duplicateAwareJson";
import { parseProductionSoundEvidence } from "../verifyProductionNonVideoDeliverables";

/**
 * Probe complete deliverable bytes according to the declared kind and media type. Guide semantic palettes and audio sound-evidence JSON use duplicate-aware production ingress; encoded PNG, WebVTT and MP4 formats use the render package's existing parser. A successful probe states media facts, not visible or audible acceptance.
 *
 * @evidence contracts/common.md#principled-implementation The two supported JSON sidecar discriminants select strict parsing and their engine/schema verifier; all other associations delegate to the encoded-media dispatcher, which rejects unsupported or malformed streams.
 * @evidence contracts/common.md#clear-and-simple-design Production-specific JSON schemas remain at this boundary and format parsing remains in render/node; no duplicate media decoder or inferred media type is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Semantic-mask and sound-evidence routing is based on the actual declared protocol, not a fixture or consumer. Malformed JSON/parser failures refuse and no scalar projection replaces the full evidence identity.
 * @evidence contracts/common.md#meaningful-documentation Documents complete byte input, declared association, retained probe ownership and thrown format refusals. Publication commits, resident readers and final delivery diagnostics consume the same parser facts.
 * @evidence contracts/performance.md#efficient-algorithms JSON work includes UTF-8 decoding, duplicate-aware parsing, complete schema/mask verification and semantic canonical sorting/hashing; numeric suffix copies can preclude a strict linear parse bound. PNG includes chunk/CRC inspection and pixel decoding; WebVTT visits text/cues, and MP4 parsing/table/range lookup includes S log(M+1) residency work per track for S samples and M media boxes.
 * @evidence contracts/performance.md#reuse-equivalent-work Each invocation consumes the caller's reopened bytes once and returns its parsed facts for that caller to retain; shared MP4 parsing within the render dispatcher serves its tracks, while no cross-file or cross-request verdict cache is created.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed input bytes coexist with decoded JSON/text/pixels or MP4 tables and copies until invocation-local references are collectable; returned palette/evidence/probe lists remain with the caller. No file handle or asynchronous task is opened, and payload/sample populations are uncapped at this orchestration boundary.
 */
export const probeProductionMedia: (props: {

    /** Declared deliverable kind selecting the supported media association. */
    kind: IAutoMovieProductionDeliverable["kind"];

    /** Declared media type selecting JSON sidecars or the encoded-media parser. */
    mediaType: string;

    /** Complete supplied media or sidecar bytes, borrowed for this invocation. */
    bytes: Uint8Array;
}) => IAutoMovieProductionMediaProbe = (props: {

    /** Declared deliverable kind selecting the supported media association. */
    kind: IAutoMovieProductionDeliverable["kind"];

    /** Declared media type selecting JSON sidecars or the encoded-media parser. */
    mediaType: string;

    /** Complete supplied media or sidecar bytes, borrowed for this invocation. */
    bytes: Uint8Array;
}): IAutoMovieProductionMediaProbe => {
    if (props.kind === "guide-pass" &&
        props.mediaType === AUTOMOVIE_SEMANTIC_MASK_MEDIA_TYPE) {
        let mask: IAutoMovieSemanticMask;
        try {
            mask = parseAutoMovieStructuredJson({
                record: "semantic-mask-sidecar",
                bytes: props.bytes,
            }) as IAutoMovieSemanticMask;
        }
        catch {
            throw new Error("Semantic-mask sidecar bytes are not strict UTF-8 JSON.");
        }
        verifyAutoMovieSemanticMask(mask);
        return { kind: "semantic-mask", mask };
    }
    if (props.kind === "audio-mix" && props.mediaType === "application/json") {
        return {
            kind: "sound-evidence",
            evidence: parseProductionSoundEvidence(props.bytes),
        };
    }
    return probeProductionRenderedMedia(props);
};
