import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import {
  type IAutoMovieInspectorAction,
  type IAutoMovieInspectorState,
  readAutoMovieInspectorAddress,
  reduceAutoMovieInspectorState,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `reduceAutoMovieInspectorState` applies one inspector edit to the request's
 * address keys and reads the result back; an edit the reader refuses keeps the
 * previous request and records the refusal.
 *
 * Each expectation is the address text the edit should leave, read through the
 * same address reader.
 *
 * Scenarios, from "parts=a&from=1&to=2&rate=10&passes=depth":
 *
 * 1. Selecting b appends it; selecting a again keeps one; deselecting a drops it;
 *    hiding and labelling write their own lists; marks likewise.
 * 2. A colour writes `pattern=hex`, replacing the pattern's earlier colour; a null
 *    colour clears it.
 * 3. A shade replaces the passes; switches write 1 and 0; a view sets views.
 * 4. A time drops the even sampling for `at`; a locate also sets the labels.
 * 5. A subject is set and cleared.
 * 6. Text that does not read keeps the request and records an error; a restore
 *    sets both.
 */
export function test_unit_viewer_inspector_reduce_state(): void {
  const start: IAutoMovieInspectorState = {
    request: readAutoMovieInspectorAddress(
      "parts=a&from=1&to=2&rate=10&passes=depth",
    ),
    error: null,
  };
  const after: (
    ...actions: IAutoMovieInspectorAction[]
  ) => IAutoMovieInspectorState = (
    ...actions: IAutoMovieInspectorAction[]
  ): IAutoMovieInspectorState =>
    actions.reduce(reduceAutoMovieInspectorState, start);
  const read: (text: string) => IAutoMovieCapturePlanRequest = (
    text: string,
  ): IAutoMovieCapturePlanRequest => readAutoMovieInspectorAddress(text);
  const sampling: string = "from=1&to=2&rate=10";

  TestValidator.equals(
    "select appends",
    after({ type: "select", pattern: "b", on: true }).request,
    read(`parts=a,b&${sampling}&passes=depth`),
  );
  TestValidator.equals(
    "select is idempotent",
    after({ type: "select", pattern: "a", on: true }).request,
    start.request,
  );
  TestValidator.equals(
    "deselect drops",
    after({ type: "select", pattern: "a", on: false }).request,
    read(`${sampling}&passes=depth`),
  );
  TestValidator.equals(
    "hide, label and marks",
    after(
      { type: "hide", pattern: "x", on: true },
      { type: "label", pattern: "y", on: true },
      { type: "marks", pattern: "edge", on: true },
    ).request,
    read(`parts=a&hide=x&label=y&marks=edge&${sampling}&passes=depth`),
  );
  TestValidator.equals(
    "a colour replaces the pattern's earlier colour",
    after(
      { type: "color", pattern: "a", color: 0x00ff00 },
      { type: "color", pattern: "a", color: 0xff8800 },
    ).request,
    read(`parts=a&color=a=ff8800&${sampling}&passes=depth`),
  );
  TestValidator.equals(
    "a null colour clears it",
    after(
      { type: "color", pattern: "a", color: 0xff8800 },
      { type: "color", pattern: "a", color: null },
    ).request,
    start.request,
  );
  TestValidator.equals(
    "shade, switches and view",
    after(
      { type: "shade", shade: "clay" },
      { type: "switch", key: "surface", on: false },
      { type: "switch", key: "xray", on: true },
      { type: "view", view: "front" },
    ).request,
    read(`parts=a&${sampling}&shade=clay&surface=0&xray=1&views=front`),
  );
  TestValidator.equals(
    "time samples one second",
    after({ type: "time", seconds: 1.5 }).request,
    read("parts=a&at=1.5&passes=depth"),
  );
  TestValidator.equals(
    "locate also labels",
    after({ type: "locate", seconds: 0.5, label: ["b"] }).request,
    read("parts=a&at=0.5&label=b&passes=depth"),
  );
  TestValidator.equals(
    "subject set and cleared",
    [
      after({ type: "subject", name: "rook" }).request,
      after({ type: "subject", name: "rook" }, { type: "subject", name: null })
        .request,
    ],
    [read(`subject=rook&parts=a&${sampling}&passes=depth`), start.request],
  );
  const refused: IAutoMovieInspectorState = after({
    type: "text",
    text: "colour=1",
  });
  TestValidator.predicate(
    "unreadable text keeps the request",
    refused.request === start.request && refused.error !== null,
  );
  TestValidator.equals(
    "restore",
    after({ type: "restore", request: read("at=2"), error: "kept" }),
    { request: read("at=2"), error: "kept" },
  );
}
