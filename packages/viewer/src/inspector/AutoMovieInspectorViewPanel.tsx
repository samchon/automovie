import {
  type IAutoMovieCapturePlanRequest,
  type IAutoMovieInspectionView,
  formatAutoMovieInspectionView,
  parseAutoMovieInspectionView,
} from "@automovie/render";
import { type ChangeEvent, type JSX, useState } from "react";

import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";

/** The fixed camera a person starts from when choosing one: 4 m in front at eye height, looking at the origin at 1 m. */
const FIXED: string = "0,1.6,4:0,1,0";

/**
 * View: the subject's camera (`film`), a named view (the subject's own or a fitted viewpoint) with orthographic projection, following each second and a focus, or a fixed camera by coordinates, typed with any scale and up its text carries.
 *
 * The panel shows the request's first view, the one the page draws, and writes every change back as one view text through render's `formatAutoMovieInspectionView`, which the reducer replaces the request's views with. A fixed camera and a focus pattern are typed and dispatched when the field is left or Enter is pressed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the forms offered, which view is shown, how a change is written and when typed fields are dispatched.
 * @evidence contracts/development/implementation.md#principled-implementation The shown view is parsed by render's view grammar and the dispatched text written by its inverse, so every switch is one the grammar reads.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One select for the form, then the controls that form takes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A view the grammar refuses is refused by the reducer with the key named; the panel validates nothing itself.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant per render beyond the view names listed.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A view with handlers.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds only the text being typed.
 */
export function AutoMovieInspectorViewPanel(props: {
  /** The request shown. */
  request: IAutoMovieCapturePlanRequest;

  /** View names the subject offers: its own, then the fitted viewpoints. */
  views: readonly string[];

  /** Where edits go. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  const text: string = props.request.views[0]!;
  const view: IAutoMovieInspectionView = parseAutoMovieInspectionView(text);
  const [typed, setTyped] = useState<string | null>(null);
  const send: (next: IAutoMovieInspectionView) => void = (
    next: IAutoMovieInspectionView,
  ): void =>
    props.dispatch({ type: "view", view: formatAutoMovieInspectionView(next) });
  const form: string = view.type === "named" ? view.name : view.type;
  const focus: string =
    view.type === "named" && view.focus?.type === "pattern"
      ? view.focus.pattern
      : "";
  const commit: () => void = (): void => {
    if (typed === null) return;
    setTyped(null);
    if (view.type === "fixed") props.dispatch({ type: "view", view: typed });
    else if (view.type === "named")
      send({
        ...view,
        focus: typed === "" ? null : { type: "pattern", pattern: typed },
      });
  };
  return (
    <fieldset>
      <legend>View</legend>
      <select
        aria-label="View"
        value={form}
        onChange={(event: ChangeEvent<HTMLSelectElement>): void => {
          const chosen: string = event.target.value;
          setTyped(null);
          if (chosen === "film") send({ type: "film" });
          else if (chosen === "fixed")
            props.dispatch({ type: "view", view: FIXED });
          else
            send({
              type: "named",
              name: chosen,
              orthographic: false,
              follow: false,
              focus: null,
            });
        }}
      >
        <option value="film">film</option>
        {[
          ...new Set<string>([
            ...props.views,
            ...(view.type === "named" ? [view.name] : []),
          ]),
        ].map(
          (name: string): JSX.Element => (
            <option key={name} value={name}>
              {name}
            </option>
          ),
        )}
        <option value="fixed">fixed</option>
      </select>
      {view.type === "fixed" ? (
        <input
          aria-label="Fixed camera x,y,z:tx,ty,tz"
          value={typed ?? text}
          onChange={(event: ChangeEvent<HTMLInputElement>): void =>
            setTyped(event.target.value)
          }
          onBlur={commit}
          onKeyDown={(event: { key: string }): void => {
            if (event.key === "Enter") commit();
          }}
        />
      ) : null}
      {view.type === "named" ? (
        <>
          <label style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={view.orthographic}
              onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                send({ ...view, orthographic: event.target.checked })
              }
            />{" "}
            orthographic
          </label>
          <label style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={view.follow}
              onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                send({ ...view, follow: event.target.checked })
              }
            />{" "}
            follow each second
          </label>
          <label style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={view.focus?.type === "flagged"}
              onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                send({
                  ...view,
                  focus: event.target.checked ? { type: "flagged" } : null,
                })
              }
            />{" "}
            focus on flagged marks
          </label>
          <label style={{ display: "block" }}>
            focus{" "}
            <input
              aria-label="Focus pattern"
              placeholder="path pattern"
              value={typed ?? focus}
              onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                setTyped(event.target.value)
              }
              onBlur={commit}
              onKeyDown={(event: { key: string }): void => {
                if (event.key === "Enter") commit();
              }}
            />
          </label>
        </>
      ) : null}
    </fieldset>
  );
}
