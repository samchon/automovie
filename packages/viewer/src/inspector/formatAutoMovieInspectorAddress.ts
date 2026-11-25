import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import { formatAutoMovieCapturePlanRequest } from "@automovie/render";

/**
 * Characters the grammar writes that a query keeps readable: list, view, path,
 * focus, colour pair and cut separators.
 */
const READABLE: ReadonlyMap<string, string> = new Map<string, string>([
  ["%2C", ","],
  ["%3A", ":"],
  ["%3B", ";"],
  ["%2F", "/"],
  ["%40", "@"],
  ["%3D", "="],
]);

/**
 * Write a request as the query text of an address, without the leading `?`, so
 * the address repeats the request and `readAutoMovieInspectorAddress` reads it
 * back equal.
 *
 * Keys and values come from `formatAutoMovieCapturePlanRequest`, in its order
 * and with absent values left out, so the request that asks for nothing is the
 * empty text. Each key and value is escaped by `encodeURIComponent`, then the
 * separators `,`, `:`, `;`, `/`, `@` and `=` are put back, because a query may
 * hold them as they are and `URLSearchParams` reads them unchanged (a pair
 * splits at its first `=`, and no key holds one), so
 * `parts=hero/torso&views=front@focus=hero&color=hero=ff8800` stays readable. A
 * key whose value is empty is written bare.
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
