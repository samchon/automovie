/**
 * Choose preserve, strip or reject for one initial UTF-8 BOM after scalar validation.
 *
 * @evidence contracts/common.md#principled-implementation The closed policy controls only the first EF BB BF sequence; decode validates every scalar before applying it and preserves interior BOMs.
 * @evidence contracts/common.md#clear-and-simple-design Record owners choose BOM semantics while decode owns scalar admission and TextDecoder construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Unicode normalization or BOM-based encoding guessing occurs; malformed bytes remain refusals under every policy.
 * @evidence contracts/common.md#meaningful-documentation States initial-only treatment and validation-before-policy ordering.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The union erases; decode pays full byte validation, decoding and returned-string allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Policy labels retain no decoded result or equality proof for mutable bytes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The policy owns no task, buffer or handle.
 *
 * @author Samchon
 */
export type AutoMovieLeadingBomPolicy = "preserve" | "strip" | "reject";
