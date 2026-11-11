import {
  type IAutoMovieCapturePlanRequest,
  parseAutoMovieCapturePlanRequest,
} from "@automovie/render";

/**
 * Read the request an address names: its query text, with or without the leading `?`, through the capture plan grammar.
 *
 * The text is decoded by `URLSearchParams`, so `+` reads as a space and percent escapes as their characters, and the parameters go to `parseAutoMovieCapturePlanRequest` as they are. The empty text is the request that asks for nothing.
 *
 * It throws the grammar's `Error`, which names the key, for an unknown key, a key given twice or a value the grammar refuses.
 *
 * ```ts
 * const request = readAutoMovieInspectorAddress(location.search);
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the accepted text, how it is decoded, what empty text gives and what a refusal names.
 * @evidence contracts/development/implementation.md#principled-implementation `URLSearchParams` is the browser's own query decoder and satisfies the grammar's source as it is, so the page maps its address and parses nothing itself.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Strip one `?`, decode, read.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal reaches the caller; nothing falls back to a default request here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the text.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one text.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh request and keeps nothing.
 */
export function readAutoMovieInspectorAddress(
  text: string,
): IAutoMovieCapturePlanRequest {
  return parseAutoMovieCapturePlanRequest(
    new URLSearchParams(text.startsWith("?") ? text.slice(1) : text),
  );
}
