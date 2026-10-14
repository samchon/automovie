import type { AutoMovieStructuredJsonStage } from "./AutoMovieStructuredJsonStage";

/**
 * A stable structured-record refusal before schema validation.
 *
 * @evidence contracts/common.md#principled-implementation A native Error records logical record, first failed stage, UTF-8 offset, containing pointer and optional decoded duplicate name.
 * @evidence contracts/common.md#clear-and-simple-design Strict UTF-8 and recursive grammar admission share this machine-readable boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Offsets identify the first proving byte and schema admission remains the caller's responsibility.
 * @evidence contracts/common.md#meaningful-documentation Documents stage/byte/pointer units and duplicate-only member meaning.
 * @evidence contracts/performance.md#efficient-algorithms Formats the supplied message/pointer and host stack without retaining input bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh failures keep current record context instead of reusing an earlier error.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the error strings and stack; parser buffers and handles are not retained here.
 */
export class AutoMovieStructuredJsonError extends Error {

    /**
     * Stable machine-readable diagnostic code.
     */
    public readonly code: ReturnType<() => "automovie-structured-json-invalid"> = "automovie-structured-json-invalid" as const;

    /**
     * Attribute the parser-supplied refusal without validating its metadata again. An empty stored pointer displays as / in the native Error message while the pointer property keeps its original value.
     */
    public constructor(

    /** Logical record being admitted. */
    public readonly record: string,

    /** Earliest failed ingress stage. */
    public readonly stage: AutoMovieStructuredJsonStage,

    /** UTF-8 byte offset that proves the failure. */
    public readonly offset: number,

    /** JSON Pointer of the containing value. */
    public readonly pointer: string, detail: string,

    /** Decoded duplicate name, only at the duplicate stage. */
    public readonly member?: string) {
        super(`AutoMovie JSON record "${record}" failed ${stage} admission at byte ${offset} (${pointer || "/"}): ${detail}`);
        this.name = "AutoMovieStructuredJsonError";
    }
}
