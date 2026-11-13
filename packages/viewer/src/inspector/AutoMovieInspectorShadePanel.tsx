import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionRequest,
} from "@automovie/render";
import type { ChangeEvent, JSX } from "react";

import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";

/** Every shade, keyed so the compiler refuses a list that misses one. */
const SHADES: Record<IAutoMovieInspectionRequest.Shade, true> = {
  beauty: true,
  depth: true,
  mask: true,
  normal: true,
  outline: true,
  pose: true,
  clay: true,
  faces: true,
};

/**
 * Shade and surface: how surfaces are coloured and whether they are drawn.
 *
 * The page draws the request's first pass, so the shade shown is `passes[0]`; choosing one replaces every pass with it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the panel edits and how several passes become one.
 * @evidence contracts/development/implementation.md#principled-implementation The shade list is a record keyed by the request's shade union, so a shade render adds fails compilation here until it is offered.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One select and one checkbox, each dispatching one edit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The panel shows the request's values and keeps no copy of them.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant per render.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A view with handlers.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds nothing.
 */
export function AutoMovieInspectorShadePanel(props: {
  /** The request shown. */
  request: IAutoMovieCapturePlanRequest;

  /** Where edits go. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <legend style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>Shade</legend>
      <select
        aria-label="Shade"
        value={props.request.passes[0]}
        onChange={(event: ChangeEvent<HTMLSelectElement>): void => {
          const shade: string = event.target.value;
          if (isShade(shade)) props.dispatch({ type: "shade", shade });
        }}
      >
        {Object.keys(SHADES).map(
          (shade: string): JSX.Element => (
            <option key={shade} value={shade}>
              {shade}
            </option>
          ),
        )}
      </select>{" "}
      <label>
        <input
          type="checkbox"
          checked={props.request.inspection.surface}
          onChange={(event: ChangeEvent<HTMLInputElement>): void =>
            props.dispatch({
              type: "switch",
              key: "surface",
              on: event.target.checked,
            })
          }
        />{" "}
        surface
      </label>
    </fieldset>
  );
}

/** Whether a text is one of the shades offered. */
function isShade(text: string): text is IAutoMovieInspectionRequest.Shade {
  return Object.hasOwn(SHADES, text);
}
