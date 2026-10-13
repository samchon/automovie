import { AutoMovieUtf8Error, decodeAutoMovieUtf8 } from "./strictUtf8";
import { AutoMovieStructuredJsonError } from "./AutoMovieStructuredJsonError";
import { AutoMovieStructuredJsonParser } from "./AutoMovieStructuredJsonParser";

/**
 * Decode and materialize a persistent JSON record exactly once.
 *
 * Member names are compared after JSON escape decoding and within their own object scope. A duplicate is refused before any last-wins object can escape to schema validation.
 *
 * @evidence contracts/common.md#principled-implementation Strict scalar UTF-8 decoding precedes a single duplicate-aware grammar/materialization pass; encoding errors gain the logical record's structured stage.
 * @evidence contracts/common.md#clear-and-simple-design Persistent record owners receive unknown JSON and separately decide exact schema admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A preserved leading BOM is refused by JSON grammar; strict decoder failure is assumed to be its typed AutoMovieUtf8Error, and no fallback last-wins parse occurs.
 * @evidence contracts/common.md#meaningful-documentation States decoded-name duplicate scope, stage/byte/pointer diagnostics and caller-owned output tree.
 * @evidence contracts/performance.md#efficient-algorithms Includes B-byte UTF-8 validation/decoding and complete recursive parsing, whose number suffix slicing can add quadratic text-copy work; no byte-size bound is imposed.
 * @evidence contracts/performance.md#reuse-equivalent-work Grammar admission and materialization share one parser pass; each invocation observes its supplied exact bytes without a retained record cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The output tree transfers to the caller; decoded text/parser frames/name sets expire after success or refusal and no file handle is acquired.
 */
export const parseAutoMovieStructuredJson: (props: {

    /**
     * Logical record named by refusals.
     */
    record: string;

    /**
     * Exact persistent bytes.
     */
    bytes: Uint8Array;
}) => unknown = (props: {

    /**
     * Logical record named by refusals.
     */
    record: string;

    /**
     * Exact persistent bytes.
     */
    bytes: Uint8Array;
}): unknown => {
    let text: string;
    try {
        text = decodeAutoMovieUtf8({
            record: props.record,
            bytes: props.bytes,
            leadingBom: "preserve",
        });
    }
    catch (error) {
        // The strict decoder throws nothing but its own typed refusal, so the
        // encoding stage restates that refusal under the JSON record's identity.
        const utf8: AutoMovieUtf8Error = error as AutoMovieUtf8Error;
        throw new AutoMovieStructuredJsonError(props.record, "encoding", utf8.offset, "", utf8.category);
    }
    return new AutoMovieStructuredJsonParser(props.record, text).parse();
};
