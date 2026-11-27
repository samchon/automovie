import type { IAutoMovieInspectorState } from "../IAutoMovieInspectorState.js";
import { readAutoMovieInspectorAddress } from "./readAutoMovieInspectorAddress.js";
import { reduceAutoMovieInspectorState } from "./reduceAutoMovieInspectorState.js";

/**
 * Create the inspector's first state from its opening address text. A refused
 * address keeps the empty request and records the refusal so the page can draw.
 */
export function createAutoMovieInspectorState(
  text: string,
): IAutoMovieInspectorState {
  return reduceAutoMovieInspectorState(
    { request: readAutoMovieInspectorAddress(""), error: null },
    { type: "text", text },
  );
}
