import type { IAutoMovieDerivedArtifactRecord, IAutoMovieDerivedArtifactSource } from "@automovie/interface";

/**
 * Declared utf8 bytes decode fatally to text and declared base64 bytes encode losslessly; the source keeps the record's output digest.
 *
 * @evidence contracts/common.md#principled-implementation Declared utf8 bytes decode fatally to text and declared base64 bytes encode losslessly; the source keeps the record's output digest.
 * @evidence contracts/common.md#clear-and-simple-design Inspection calls materialization only after obtaining output bytes and separately checks the resident digest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This mapper does not recompute or authenticate the supplied digest by itself; encoding errors remain observable.
 * @evidence contracts/common.md#meaningful-documentation States declared encoding, digest provenance and returned content ownership.
 * @evidence contracts/performance.md#efficient-algorithms Encoding B bytes costs O(B) time and result text storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The already read output bytes are consumed directly instead of rereading the filesystem during materialization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives a fresh small source record and text; no input buffer or handle is retained by this mapper.
 */
export const derivedArtifactSourceArtifact: (record: IAutoMovieDerivedArtifactRecord, bytes: Uint8Array) => IAutoMovieDerivedArtifactSource = (record: IAutoMovieDerivedArtifactRecord, bytes: Uint8Array): IAutoMovieDerivedArtifactSource => ({
    digest: record.outputDigest,
    encoding: record.encoding,
    content: record.encoding === "utf8"
        ? new TextDecoder("utf-8", { fatal: true }).decode(bytes)
        : Buffer.from(bytes).toString("base64"),
});
