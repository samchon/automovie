import type { IAutoMovieProductionSoundEvidence } from "@automovie/interface";
import typia from "typia";
import { parseAutoMovieStructuredJson } from "../duplicateAwareJson";

/**
 * Parse strict duplicate-aware UTF-8 JSON and require the complete version-2 sound evidence schema. Throws a boundary-specific error for parse or exact-schema failure; parsing alone does not establish current plan, sibling audio bytes or measured PCM truth.
 *
 * @evidence contracts/common.md#principled-implementation Production record ingress detects duplicate keys before projection, then typia.assertEquals admits all versioned plan/analysis/TTS/audio/measurement fields without dropping extras.
 * @evidence contracts/common.md#clear-and-simple-design JSON ingress and sound schema admission are separated from contextual owner equality, which verifyProductionNonVideoDeliverables performs later.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No incomplete scalar summary or fixture-specific schema replaces the complete record. Parse/schema failures retain their boundary categories rather than returning empty evidence.
 * @evidence contracts/common.md#meaningful-documentation Documents version, duplicate-aware strict input, complete schema, thrown errors and the later semantic-owner/provenance checks needed.
 * @evidence contracts/performance.md#efficient-algorithms For B JSON bytes and its decoded record population, UTF-8 decoding, duplicate-aware parsing and full schema traversal allocate text/objects and validation work. The shared parser refuses value-dispatch depth above 256 but can repeatedly copy remaining numeric suffixes, so a strict linear B bound is not promised; text/list sizes have no independent quota here.
 * @evidence contracts/performance.md#reuse-equivalent-work The parsed record is passed directly to exact schema admission and returned once; no second JSON parse or persistent sound evidence cache is created.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input bytes remain borrowed; parsed text/records and failed validation details are invocation-local, with the admitted record transferred to the caller. No file handle or task is acquired and output lists remain retained only as the caller keeps them.
 */
export const parseProductionSoundEvidence: (bytes: Uint8Array) => IAutoMovieProductionSoundEvidence = (bytes: Uint8Array): IAutoMovieProductionSoundEvidence => {
    let parsed: unknown;
    try {
        parsed = parseAutoMovieStructuredJson({ record: "sound-evidence", bytes });
    }
    catch {
        throw new Error("Sound evidence bytes are not valid UTF-8 JSON.");
    }
    try {
        return typia.assertEquals<IAutoMovieProductionSoundEvidence>(parsed);
    }
    catch {
        throw new Error("Sound evidence is not the complete version-2 current-plan schema.");
    }
};
