import {
  type IAutoMovieCapturePlanRequest,
  formatAutoMovieCapturePlanRequest,
} from "@automovie/render";

/** Characters the grammar writes that a query keeps readable: list, view, path, focus, colour pair and cut separators. */
const READABLE: ReadonlyMap<string, string> = new Map<string, string>([
  ["%2C", ","],
  ["%3A", ":"],
  ["%3B", ";"],
  ["%2F", "/"],
  ["%40", "@"],
  ["%3D", "="],
]);

/**
 * Write a request as the query text of an address, without the leading `?`, so the address repeats the request and `readAutoMovieInspectorAddress` reads it back equal.
 *
 * Keys and values come from `formatAutoMovieCapturePlanRequest`, in its order and with absent values left out, so the request that asks for nothing is the empty text. Each key and value is escaped by `encodeURIComponent`, then the separators `,`, `:`, `;`, `/`, `@` and `=` are put back, because a query may hold them as they are and `URLSearchParams` reads them unchanged (a pair splits at its first `=`, and no key holds one), so `parts=hero/torso&views=front@focus=hero&color=hero=ff8800` stays readable. A key whose value is empty is written bare.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order, the escaping, which characters stay readable and why that is safe, the bare key and the round trip.
 * @evidence contracts/development/implementation.md#principled-implementation The grammar's own writer decides keys and values; `encodeURIComponent` escapes every character that would change the query's structure (`&`, `+`, `#`, `%`, space), and the restored separators are sub-delimiters RFC 3986 allows in a query, which the WHATWG URL parser leaves as they are; `=` inside a value is safe because `URLSearchParams` splits a pair at its first `=` and no grammar key holds one.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the written pairs and one join.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key or value is written here by hand, so a key the grammar adds reaches the address unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the length of the written request.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one request.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh string and keeps nothing.
 */
export function formatAutoMovieInspectorAddress(
  request: IAutoMovieCapturePlanRequest,
): string {
  return formatAutoMovieCapturePlanRequest(request)
    .map(([key, value]: [key: string, value: string]): string =>
      value === "" ? escape(key) : `${escape(key)}=${escape(value)}`,
    )
    .join("&");
}

/** `encodeURIComponent` with the readable separators put back. */
function escape(text: string): string {
  return encodeURIComponent(text).replace(
    /%2C|%3A|%3B|%2F|%40|%3D/gu,
    (code: string): string => READABLE.get(code)!,
  );
}
