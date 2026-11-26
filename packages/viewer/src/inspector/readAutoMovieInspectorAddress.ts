import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import { AutoMovieRenderCapture } from "@automovie/render";

/**
 * Read the request an address names: its query text, with or without the
 * leading `?`, through the capture plan grammar.
 *
 * The text is decoded by `URLSearchParams`, so `+` reads as a space and percent
 * escapes as their characters, and the parameters go to
 * `parseAutoMovieCapturePlanRequest` as they are. The empty text is the request
 * that asks for nothing.
 *
 * It throws the grammar's `Error`, which names the key, for an unknown key, a
 * key given twice or a value the grammar refuses.
 *
 * ```ts
 * const request = readAutoMovieInspectorAddress(location.search);
 * ```
 */
export function readAutoMovieInspectorAddress(
  text: string,
): IAutoMovieCapturePlanRequest {
  return AutoMovieRenderCapture.parsePlanRequest(
    new URLSearchParams(text.startsWith("?") ? text.slice(1) : text),
  );
}
