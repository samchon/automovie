import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import { AutoMovieRenderCapture } from "@automovie/render";

import type { IAutoMovieViewerInspectorAction } from "../IAutoMovieViewerInspectorAction";
import type { IAutoMovieViewerInspectorState } from "../IAutoMovieViewerInspectorState";
import { readInspectorAddress } from "./readInspectorAddress";

/*
 * Apply one edit to the inspector's request, the only way its request changes.
 *
 * The request is written as named text values by
 * `formatCapturePlanRequest`, the action changes the text of the key
 * or keys the `IAutoMovieViewerInspectorAction` table names, and the values are read
 * back by `parseCapturePlanRequest`. The result has the request read
 * and no error. When the reader refuses, the result keeps the previous request
 * beside the reader's message, which names the key, so a mistyped address or a
 * refused value never replaces the picture.
 *
 * A `text` action replaces every key with the address text's; a `restore`
 * action sets the scene's request and reason without reading anything. An edit
 * that leaves the text unchanged returns an equal request.
 */
export function reduceInspectorState(
  state: IAutoMovieViewerInspectorState,
  action: IAutoMovieViewerInspectorAction,
): IAutoMovieViewerInspectorState {
  if (action.type === "restore")
    return { request: action.request, error: action.error };
  if (action.type === "text")
    return read(
      state,
      (): IAutoMovieCapturePlanRequest =>
        readInspectorAddress(action.text),
    );

  // Every other edit changes the text of the keys it names.
  const values: Map<string, string> = new Map<string, string>(
    AutoMovieRenderCapture.formatPlanRequest(state.request),
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
          : [
              `${action.pattern}=${action.color.toString(16).padStart(6, "0")}`,
            ]),
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
    case "locate":
      // `at` excludes an even sampling, so its keys go.
      for (const key of ["from", "to", "rate"]) values.delete(key);
      values.set("at", String(action.seconds));
      if (action.type === "locate")
        edit(values, "label", (): string[] => [...action.label]);
      break;
    case "subject":
      if (action.name === null) values.delete("subject");
      else values.set("subject", action.name);
      break;
  }
  return read(
    state,
    (): IAutoMovieCapturePlanRequest =>
      AutoMovieRenderCapture.parsePlanRequest(values),
  );
}

/*
 * The key each toggle edits.
 */
const LISTS: Record<IAutoMovieViewerInspectorAction.IToggle["type"], string> = {
  select: "parts",
  hide: "hide",
  label: "label",
  marks: "marks",
};

/*
 * The state a reading gives: its request, or the previous request with the
 * refusal.
 */
function read(
  state: IAutoMovieViewerInspectorState,
  reading: () => IAutoMovieCapturePlanRequest,
): IAutoMovieViewerInspectorState {
  try {
    return { request: reading(), error: null };
  } catch (error) {
    return {
      request: state.request,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/*
 * Rewrite one comma-separated key; an empty list removes the key.
 */
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
