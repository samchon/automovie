import {
  type IAutoMovieCapturePlanRequest,
  formatAutoMovieCapturePlanRequest,
  parseAutoMovieCapturePlanRequest,
} from "@automovie/render";

import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";
import type { IAutoMovieInspectorState } from "./IAutoMovieInspectorState.js";
import { readAutoMovieInspectorAddress } from "./readAutoMovieInspectorAddress.js";

/** The key each toggle edits. */
const LISTS: Record<IAutoMovieInspectorAction.IToggle["type"], string> = {
  select: "parts",
  hide: "hide",
  label: "label",
  marks: "marks",
};

/**
 * Apply one edit to the inspector's request, the only way its request changes.
 *
 * The request is written as named text values by `formatAutoMovieCapturePlanRequest`, the action changes the text of the key or keys the `IAutoMovieInspectorAction` table names, and the values are read back by `parseAutoMovieCapturePlanRequest`. The result has the request read and no error. When the reader refuses, the result keeps the previous request beside the reader's message, which names the key, so a mistyped address or a refused value never replaces the picture.
 *
 * A `text` action replaces every key with the address text's; a `restore` action sets the scene's request and reason without reading anything. An edit that leaves the text unchanged returns an equal request.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how an edit becomes a request, what the result holds when accepted and when refused, and the two actions that bypass the key edit.
 * @evidence contracts/development/implementation.md#principled-implementation Editing the grammar's own text and reading it back means every control goes through the one reader the address and the command use, so the reducer restates no default, no validation and no member of the typed request; a key the reader adds starts working without a change here.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Write, edit the keys of one action in one switch, read; list and colour edits share two small helpers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal is reported, never patched by dropping the offending key, and the time edit removes the sampling keys `at` excludes instead of letting the reader refuse the mix.
 * @evidence contracts/development/implementation.md#efficient-algorithms One write and one read of the request, linear in its text, per dispatched edit; playback dispatches none.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one state and one action.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh state and keeps nothing.
 */
export function reduceAutoMovieInspectorState(
  state: IAutoMovieInspectorState,
  action: IAutoMovieInspectorAction,
): IAutoMovieInspectorState {
  if (action.type === "restore")
    return { request: action.request, error: action.error };
  if (action.type === "text")
    return read(state, (): IAutoMovieCapturePlanRequest =>
      readAutoMovieInspectorAddress(action.text),
    );

  // Every other edit changes the text of the keys it names.
  const values: Map<string, string> = new Map<string, string>(
    formatAutoMovieCapturePlanRequest(state.request),
  );
  switch (action.type) {
    case "select":
    case "hide":
    case "label":
    case "marks":
      edit(values, LISTS[action.type], (items: string[]): string[] =>
        action.on
          ? items.includes(action.pattern)
            ? items
            : [...items, action.pattern]
          : items.filter((item: string): boolean => item !== action.pattern),
      );
      break;
    case "color":
      edit(values, "color", (items: string[]): string[] => [
        ...items.filter(
          (item: string): boolean => !item.startsWith(`${action.pattern}=`),
        ),
        ...(action.color === null
          ? []
          : [`${action.pattern}=${action.color.toString(16).padStart(6, "0")}`]),
      ]);
      break;
    case "shade":
      values.delete("passes");
      values.set("shade", action.shade);
      break;
    case "switch":
      values.set(action.key, action.on ? "1" : "0");
      break;
    case "view":
      values.set("views", action.view);
      break;
    case "time":
      // `at` excludes an even sampling, so its keys go.
      for (const key of ["from", "to", "rate"]) values.delete(key);
      values.set("at", String(action.seconds));
      break;
    case "subject":
      if (action.name === null) values.delete("subject");
      else values.set("subject", action.name);
      break;
  }
  return read(state, (): IAutoMovieCapturePlanRequest =>
    parseAutoMovieCapturePlanRequest(values),
  );
}

/** The state a reading gives: its request, or the previous request with the refusal. */
function read(
  state: IAutoMovieInspectorState,
  reading: () => IAutoMovieCapturePlanRequest,
): IAutoMovieInspectorState {
  try {
    return { request: reading(), error: null };
  } catch (error) {
    return {
      request: state.request,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Rewrite one comma-separated key; an empty list removes the key. */
function edit(
  values: Map<string, string>,
  key: string,
  change: (items: string[]) => string[],
): void {
  const items: string[] = change(
    (values.get(key) ?? "")
      .split(",")
      .map((item: string): string => item.trim())
      .filter((item: string): boolean => item !== ""),
  );
  if (items.length === 0) values.delete(key);
  else values.set(key, items.join(","));
}
