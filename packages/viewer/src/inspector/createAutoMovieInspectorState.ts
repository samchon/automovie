import type { IAutoMovieInspectorState } from "./IAutoMovieInspectorState.js";
import { readAutoMovieInspectorAddress } from "./readAutoMovieInspectorAddress.js";
import { reduceAutoMovieInspectorState } from "./reduceAutoMovieInspectorState.js";

/**
 * The inspector's first state, read from the address text it opens with.
 *
 * The text is applied as a `text` edit of the request the empty address names,
 * which asks for nothing, so a refused address opens on that request with the
 * refusal shown and the page still draws.
 */
export function createAutoMovieInspectorState(
  text: string,
): IAutoMovieInspectorState {
  return reduceAutoMovieInspectorState(
    { request: readAutoMovieInspectorAddress(""), error: null },
    { type: "text", text },
  );
}
