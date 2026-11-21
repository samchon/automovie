import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionLegendEntry,
} from "@automovie/interface";
import {
  type IApplyAutoMovieInspectionProps,
  listAutoMovieInspectionKindOptions,
} from "@automovie/render";
import type { ChangeEvent, JSX } from "react";

import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";

/**
 * Controls for available mark kinds and x-ray, with the legend of the current picture.
 *
 * Render lists both declared and styled kinds. A kind is checked when the request holds its name as a mark pattern. Typed patterns keep their own controls. Swatches come from supplied or measured styles, and the legend counts what is drawn now.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is listed, when a kind is checked, where typed patterns appear and what the legend counts.
 * @evidence contracts/development/implementation.md#principled-implementation Render's shared option list admits the declared and styled kinds. Its inspection handle supplies the current legend. A declaration without a style still has a checkbox.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One checkbox per kind, one switch, one list of legend entries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A typed pattern that is not a listed kind is shown with its own checkbox rather than dropped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the supplied marks, the kinds, the patterns and the legend.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A view with handlers.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds nothing.
 */
export function AutoMovieInspectorMarksPanel(props: {
  /** The request shown. */
  request: IAutoMovieCapturePlanRequest;

  /** The marks the subject supplies, from which the kinds are listed. */
  marks: NonNullable<IApplyAutoMovieInspectionProps["marks"]>;

  /** Mark kinds declared for the subject's lifetime. */
  markKinds?: readonly string[];

  /** The legend of the current picture. */
  legend: readonly IAutoMovieInspectionLegendEntry[];

  /** Where edits go. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  const marks: string[] = props.request.inspection.marks;
  const colors: ReadonlyMap<string, number | undefined> =
    listAutoMovieInspectionKindOptions(
      { request: props.request.inspection, marks: props.marks },
      props.markKinds,
    );
  const listed: string[] = [...new Set([...colors.keys(), ...marks])];
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
        Marks
      </legend>
      {listed.map((kind: string): JSX.Element => {
        const color: number | undefined = colors.get(kind);
        return (
          <label key={kind} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={marks.includes(kind)}
              onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                props.dispatch({
                  type: "marks",
                  pattern: kind,
                  on: event.target.checked,
                })
              }
            />{" "}
            {color !== undefined ? (
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  marginRight: 4,
                  background: `#${color.toString(16).padStart(6, "0")}`,
                }}
              />
            ) : null}
            {kind}
          </label>
        );
      })}
      <label style={{ display: "block" }}>
        <input
          type="checkbox"
          checked={props.request.inspection.xray}
          onChange={(event: ChangeEvent<HTMLInputElement>): void =>
            props.dispatch({
              type: "switch",
              key: "xray",
              on: event.target.checked,
            })
          }
        />{" "}
        x-ray
      </label>
      <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0" }}>
        {props.legend.map(
          (entry: IAutoMovieInspectionLegendEntry): JSX.Element => (
            <li key={`${entry.label}:${entry.color}`}>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  marginRight: 6,
                  background: `#${entry.color.toString(16).padStart(6, "0")}`,
                }}
              />
              {entry.label} x{entry.count}
            </li>
          ),
        )}
      </ul>
    </fieldset>
  );
}
