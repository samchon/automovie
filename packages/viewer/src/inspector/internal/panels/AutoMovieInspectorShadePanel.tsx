import type {
  AutoMovieInspectionShade,
  IAutoMovieCapturePlanRequest,
} from "@automovie/interface";
import type { ChangeEvent, JSX } from "react";

import type { IAutoMovieViewerInspectorAction } from "../../IAutoMovieViewerInspectorAction.js";

/*
 * Shade and surface: how surfaces are coloured and whether they are drawn.
 *
 * The page draws the request's first pass, so the shade shown is `passes[0]`;
 * choosing one replaces every pass with it.
 */
export function AutoMovieInspectorShadePanel(
  props: AutoMovieInspectorShadePanel.IProps,
): JSX.Element {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <legend
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        }}
      >
        Shade
      </legend>
      <select
        aria-label="Shade"
        value={props.request.passes[0]}
        onChange={(event: ChangeEvent<HTMLSelectElement>): void => {
          const shade: AutoMovieInspectionShade | undefined =
            OPTIONS[event.target.selectedIndex];
          if (shade !== undefined) props.dispatch({ type: "shade", shade });
        }}
      >
        {OPTIONS.map(
          (shade: AutoMovieInspectionShade): JSX.Element => (
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

export namespace AutoMovieInspectorShadePanel {
  export interface IProps {
    /*
     * The request shown.
     */
    request: IAutoMovieCapturePlanRequest;

    /*
     * Where edits go.
     */
    dispatch: (action: IAutoMovieViewerInspectorAction) => void;
  }
}

/*
 * Every shade offered.
 */
const SHADES: IShadeIndex = {
  beauty: "beauty",
  depth: "depth",
  mask: "mask",
  normal: "normal",
  outline: "outline",
  pose: "pose",
  albedo: "albedo",
  graphics: "graphics",
  clay: "clay",
  faces: "faces",
};

/*
 * The shades in option order.
 */
const OPTIONS: AutoMovieInspectionShade[] = Object.values(SHADES);

/*
 * Each shade keyed by itself, so the compiler refuses a list that misses one.
 */
type IShadeIndex = { [Shade in AutoMovieInspectionShade]: Shade };
