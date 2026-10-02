import { TestValidator } from "@nestia/e2e";

import type { HumanViewerRender } from "../../../scripts/human-viewer/HumanViewerRender";
import type { IHumanViewerClient } from "../../../scripts/human-viewer/IHumanViewerClient";
import { rejectsWith } from "../internal/rejectsWith";
import { captureBodyFrames } from "../../../scripts/body-review/captureBodyFrames";

const viewerOf = (refuse: (fields: Record<string, string>) => string | null) => {
  const dropped: { label: string; documents: { id: string }[]; candidateBasis?: string | null }[] = [];
  const renders: Record<string, string>[] = [];
  const viewer: IHumanViewerClient = {
    renderer: "GPU",
    revision: "r",
    drop: async (props) => {
      dropped.push(props);
    },
    render: async (fields): Promise<HumanViewerRender> => {
      renders.push(fields);
      const reason = refuse(fields);
      return reason === null
        ? { ok: true, bytes: Buffer.from("png"), renderer: "GPU" }
        : { ok: false, error: reason };
    },
    parts: async () => [],
  };
  return { viewer, dropped, renders };
};
const state: { shape: Record<string, number>; pose: never[] } = { shape: { macroAge: 1 }, pose: [] };
const frame = (name: string, view: string, pass: string, isolate: string[] | null, document = state) =>
  ({ state: name, document, view, pass, isolate }) as never;

/**
 * A body review draws its frames through the viewer, one document per state.
 *
 * Scenarios:
 * 1. Two states with three frames offer two documents once, each composed as
 *    `{id, name, basis, ...state}`, and render `file:<label>/<state>` in frame
 *    order at 900 pixels with the isolated parts joined; an isolated frame
 *    names its file with the parts and an assembled one does not.
 * 2. The same state name with a different document gets a second id (`~2`),
 *    while the same name and document share one.
 * 3. In record mode a refused state is recorded once and its remaining frames
 *    are skipped while the next state still draws; in throw mode the same
 *    refusal stops the run with the reason.
 * 4. A part name the viewer does not know stops the run in either mode with the
 *    blank-frame message, and a candidate basis reaches the drop.
 */
export const test_body_capture_frames = async (): Promise<void> => {
  const ok = viewerOf(() => null);
  const result = await captureBodyFrames({
    viewer: ok.viewer,
    label: "L",
    basisId: "body-basis",
    candidateBasis: "C:/candidate.json.gz",
    onRefused: "throw",
    frames: [
      frame("a", "front", "beauty", null),
      frame("a", "left", "clay", ["Human", "Human.eye"]),
      frame("b", "front", "beauty", null, { shape: {}, pose: [] }),
      frame("a", "back", "beauty", null, { shape: { macroAge: -1 }, pose: [] }),
    ],
  });
  TestValidator.equals("dropped documents", ok.dropped[0]!.documents, [
    { id: "a", name: "a", basis: "body-basis", shape: { macroAge: 1 }, pose: [] },
    { id: "b", name: "b", basis: "body-basis", shape: {}, pose: [] },
    { id: "a~2", name: "a~2", basis: "body-basis", shape: { macroAge: -1 }, pose: [] },
  ] as never);
  TestValidator.equals("label and candidate", [ok.dropped.length, ok.dropped[0]!.label, ok.dropped[0]!.candidateBasis], [1, "L", "C:/candidate.json.gz"]);
  TestValidator.equals("render fields", ok.renders[1], {
    doc: "file:L/a",
    view: "left",
    pass: "clay",
    parts: "Human,Human.eye",
    size: "900",
  });
  TestValidator.equals("assembled has no parts", ok.renders[0]!.parts, undefined);
  TestValidator.equals("order", ok.renders.map((fields) => fields.doc), ["file:L/a", "file:L/a", "file:L/b", "file:L/a~2"]);
  TestValidator.equals(
    "file names",
    result.drawn.map((entry) => entry.file),
    ["a__front__beauty.png", "a-only-human-human-eye__left__clay.png", "b__front__beauty.png", "a__back__beauty.png"],
  );

  const refusing = viewerOf((fields) => (fields.doc === "file:L/a" ? "range refused" : null));
  const recorded = await captureBodyFrames({
    viewer: refusing.viewer,
    label: "L",
    basisId: "b",
    onRefused: "record",
    frames: [
      frame("a", "front", "beauty", null),
      frame("a", "left", "beauty", null),
      frame("b", "front", "beauty", null, { shape: {}, pose: [] }),
    ],
  });
  TestValidator.equals("recorded", [recorded.refused, recorded.drawn.map((entry) => entry.state), refusing.renders.length], [
    [{ state: "a", reason: "range refused" }],
    ["b"],
    2,
  ]);
  TestValidator.predicate(
    "throw mode and unknown mesh",
    (await rejectsWith(
      () =>
        captureBodyFrames({
          viewer: refusing.viewer,
          label: "L",
          basisId: "b",
          onRefused: "throw",
          frames: [frame("a", "front", "beauty", null)],
        }),
      'The viewer refused state "a": range refused',
    )) &&
      (await rejectsWith(
        () =>
          captureBodyFrames({
            viewer: viewerOf(() => "Unknown mesh: Ghost").viewer,
            label: "L",
            basisId: "b",
            onRefused: "record",
            frames: [frame("a", "front", "beauty", ["Ghost"])],
          }),
        "No displayed part is named Ghost",
      )),
  );
};
