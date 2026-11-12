import type { IAutoMovieInspectorState } from "./IAutoMovieInspectorState.js";
import { readAutoMovieInspectorAddress } from "./readAutoMovieInspectorAddress.js";
import { reduceAutoMovieInspectorState } from "./reduceAutoMovieInspectorState.js";

/**
 * The inspector's first state, read from the address text it opens with.
 *
 * The text is applied as a `text` edit of the request the empty address names, which asks for nothing, so a refused address opens on that request with the refusal shown and the page still draws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where the first request comes from and what a refused address gives.
 * @evidence contracts/development/implementation.md#principled-implementation The empty address is the grammar's request that asks for nothing, and the opening text goes through the same reducer edit a typed address does, so both refuse alike.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the empty address, then reduce the given text onto it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No default request is written here; the grammar's empty reading supplies it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two readings, linear in the text's length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per inspector, as `useReducer`'s initializer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh state and keeps nothing.
 */
export function createAutoMovieInspectorState(
  text: string,
): IAutoMovieInspectorState {
  return reduceAutoMovieInspectorState(
    { request: readAutoMovieInspectorAddress(""), error: null },
    { type: "text", text },
  );
}
