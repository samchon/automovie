import {
  type IApplyAutoMovieInspectionProps,
  type IAutoMovieCapturePlanRequest,
  type IAutoMovieInspectionKind,
  type IAutoMovieInspectionLegendEntry,
  listAutoMovieInspectionKinds,
} from "@automovie/render";
import type { ChangeEvent, JSX } from "react";

import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";

/**
 * Marks: the kinds the picture can draw, each with its default colour and switched by its own kind pattern, the x-ray switch, and the legend of what the picture draws.
 *
 * The kinds are render's `listAutoMovieInspectionKinds` of the supplied marks under the request in force, so a sliver limit or a trail adds its kinds as soon as it is asked for. A kind is checked when the request's `marks` holds that kind as a pattern; patterns typed in the address, such as `defect/*`, stay in the request and are listed beside the kinds. The legend is the inspection's: each colour drawn, what it marks and how many marks carry it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is listed, when a kind is checked, where typed patterns appear and what the legend counts.
 * @evidence contracts/development/implementation.md#principled-implementation The kinds come from render's one kind list and the legend from render's inspection handle, so the panel restates no kind rule and invents no colour.
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

  /** The legend of the current picture. */
  legend: readonly IAutoMovieInspectionLegendEntry[];

  /** Where edits go. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  const marks: string[] = props.request.inspection.marks;
  const kinds: IAutoMovieInspectionKind[] = listAutoMovieInspectionKinds({
    request: props.request.inspection,
    marks: props.marks,
  });
  const colors: Map<string, number> = new Map<string, number>(
    kinds.map((entry: IAutoMovieInspectionKind): [string, number] => [
      entry.kind,
      entry.color,
    ]),
  );
  const listed: string[] = [
    ...new Set<string>([
      ...kinds.map((entry: IAutoMovieInspectionKind): string => entry.kind),
      ...marks,
    ]),
  ];
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
      {listed.map(
        (kind: string): JSX.Element => (
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
            {colors.has(kind) ? (
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  marginRight: 4,
                  background: `#${colors.get(kind)!.toString(16).padStart(6, "0")}`,
                }}
              />
            ) : null}
            {kind}
          </label>
        ),
      )}
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
