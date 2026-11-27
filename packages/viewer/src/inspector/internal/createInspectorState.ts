import type { IAutoMovieViewerInspectorState } from "../IAutoMovieViewerInspectorState";
import { readInspectorAddress } from "./readInspectorAddress";
import { reduceInspectorState } from "./reduceInspectorState";

/*
 * Create the inspector's first state from its opening address text. A refused
 * address keeps the empty request and records the refusal so the page can draw.
 */
export function createInspectorState(
  text: string,
): IAutoMovieViewerInspectorState {
  return reduceInspectorState(
    { request: readInspectorAddress(""), error: null },
    { type: "text", text },
  );
}
