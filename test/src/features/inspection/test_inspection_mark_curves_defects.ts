import {
  type IAutoMovieConstructionCurve,
  type IAutoMovieMark,
  markAutoMovieConstructionCurves,
} from "@automovie/engine";
import {
  type IAutoMovieInspectionHandle,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * Construction curves handed over as marks, and mesh defects the inspection measures itself, are drawn at the positions and in the colours the instrument drew them in before marks were one type.
 *
 * Scenarios:
 *
 * 1. `markAutoMovieConstructionCurves` turns a closed section ring, an open guide and a flagged axis of a form built into `panel` into marks of kinds `curve/section`, `curve/guide` and `curve/axis` at paths `panel/<id>`, anchored to `panel`, sharing the curves' points, flagged where the curve was.
 * 2. Drawn under `marks=curve`, the ring's four sides, the guide's one segment and the axis's one segment lie at the authored points carried by `panel`'s placement, in blue `59a0f4`, green `59cb89` and the flag magenta, and the legend counts one section curve, one guide curve and one flagged axis curve.
 * 3. A two-metre quad under `marks=defect/open` has four open edges, drawn as four segments on its boundary in red `ff3b30`, at paths `open/defect/open/0` to `3`, counted as four `open edge`.
 * 4. After the quad's first vertex moves and `update` runs, the edge marks at that vertex follow it.
 * 5. Only the asked kinds are measured: `defect/degenerate` on the same quad draws nothing and adds no legend entry.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the engine producer and the public inspection on authored curves and a quad, and reads the marks, the world-space segment ends, their colours, `selected` and the legend.
 * @evidence contracts/development/testing.md#independent-expectations Positions are the authored curve points under `panel`'s authored translation and the quad's four corners, colours are the hues the curve producer and the palette document, and the counts follow from a quad having four boundary edges.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts closed against open curves, flagged against plain, curves against defects, a vertex before and after it moves, and an asked defect kind against one that is absent. Defect measurement itself belongs to `test_measure_mesh_defects`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own curves and quad and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: markAutoMovieConstructionCurves turns a closed section ring, an open guide and a flagged axis).
 */
export function test_inspection_mark_curves_defects(): void {
  // 1. The producer.
  const curve = (
    id: string,
    kind: IAutoMovieConstructionCurve.Kind,
    closed: boolean,
    points: number[],
    flagged: boolean = false,
  ): IAutoMovieConstructionCurve => ({ id, kind, part: "torso", closed, points, flagged });
  const ring: IAutoMovieConstructionCurve = curve(
    "torso/section/0",
    "section",
    true,
    [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0],
  );
  const guide: IAutoMovieConstructionCurve = curve("torso/guide/0", "guide", false, [0, 0, 0, 0, 1, 0]);
  const axis: IAutoMovieConstructionCurve = curve("torso/axis", "axis", false, [0, 0, -1, 0, 0, 1], true);
  const marks: IAutoMovieMark[] = markAutoMovieConstructionCurves([ring, guide, axis], "panel");
  TestValidator.equals(
    "each curve becomes one anchored polyline mark",
    marks.map((mark: IAutoMovieMark) => [mark.path, mark.kind, mark.label, mark.color, mark.flagged, mark.anchor, mark.shape.type]),
    [
      ["panel/torso/section/0", "curve/section", "section curve", 0x59a0f4, false, "panel", "polyline"],
      ["panel/torso/guide/0", "curve/guide", "guide curve", 0x59cb89, false, "panel", "polyline"],
      ["panel/torso/axis", "curve/axis", "axis curve", 0x00e5ff, true, "panel", "polyline"],
    ],
  );
  TestValidator.predicate(
    "the marks share the curves' points and closure",
    (marks[0]!.shape as IAutoMovieMark.IPolyline).points === ring.points &&
      (marks[0]!.shape as IAutoMovieMark.IPolyline).closed &&
      !(marks[1]!.shape as IAutoMovieMark.IPolyline).closed,
  );
  TestValidator.equals(
    "a form at the root anchors to the empty path",
    markAutoMovieConstructionCurves([guide], "").map((mark: IAutoMovieMark) => [mark.path, mark.anchor]),
    [["torso/guide/0", ""]],
  );

  // 2. Drawn curves.
  const panel: THREE.Mesh = InspectionScene.quad("panel", 3);
  const form: THREE.Scene = InspectionScene.scene(panel);
  const curves: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: form,
    request: InspectionScene.ask({ marks: ["curve"] }),
    marks,
  });
  const lines = InspectionScene.strokes(form);
  TestValidator.equals("one line object for the anchor", lines.length, 1);
  InspectionScene.close(
    "the curves lie at their points under panel's placement",
    InspectionScene.segments(lines[0]!).flat(),
    [
      2.5, -0.5, 0, 3.5, -0.5, 0, 3.5, -0.5, 0, 3.5, 0.5, 0, 3.5, 0.5, 0, 2.5, 0.5, 0, 2.5, 0.5, 0, 2.5, -0.5, 0,
      3, 0, 0, 3, 1, 0,
      3, 0, -1, 3, 0, 1,
    ],
  );
  TestValidator.equals(
    "each curve in its kind's colour, the flagged one in magenta",
    InspectionScene.colors(lines[0]!),
    [0x59a0f4, 0x59a0f4, 0x59a0f4, 0x59a0f4, 0x59cb89, 0xff00ff],
  );
  TestValidator.equals("the legend counts curves", curves.legend, [
    { label: "section curve", color: 0x59a0f4, count: 1 },
    { label: "guide curve", color: 0x59cb89, count: 1 },
    { label: "axis curve (flagged)", color: 0xff00ff, count: 1 },
  ]);
  curves.restore();

  // 3. Measured open edges.
  const open: THREE.Mesh = InspectionScene.quad("open");
  const torn: THREE.Scene = InspectionScene.scene(open);
  const edges: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: torn,
    request: InspectionScene.ask({ marks: ["defect/open"] }),
  });
  const boundary = InspectionScene.strokes(torn);
  const sorted = (segments: number[][]): string[] =>
    segments
      .map((s: number[]): string => {
        const ends: string[] = [s.slice(0, 3), s.slice(3)].map((p: number[]) => p.map((v: number) => v.toFixed(6)).join(","));
        return ends.sort((a: string, b: string): number => a.localeCompare(b)).join("|");
      })
      .sort((a: string, b: string): number => a.localeCompare(b));
  TestValidator.equals(
    "a quad's four boundary edges are marked",
    sorted(InspectionScene.segments(boundary[0]!)),
    sorted([
      [-1, 1, 0, 1, 1, 0],
      [1, 1, 0, 1, -1, 0],
      [1, -1, 0, -1, -1, 0],
      [-1, -1, 0, -1, 1, 0],
    ]),
  );
  TestValidator.equals(
    "in the open edge red, at their paths, counted as four",
    [
      InspectionScene.colors(boundary[0]!),
      edges.selected,
      edges.legend,
    ],
    [
      [0xff3b30, 0xff3b30, 0xff3b30, 0xff3b30],
      ["open", "open/defect/open/0", "open/defect/open/1", "open/defect/open/2", "open/defect/open/3"],
      [{ label: "open edge", color: 0xff3b30, count: 4 }],
    ],
  );

  // 4. The marks follow a moved vertex.
  const position: THREE.BufferAttribute = open.geometry.getAttribute("position") as THREE.BufferAttribute;
  const corner: number[] = [position.getX(0), position.getY(0), position.getZ(0)];
  position.setY(0, 3);
  edges.update();
  TestValidator.predicate(
    "an edge at the moved vertex now ends at its new place",
    InspectionScene.segments(boundary[0]!).some(
      (s: number[]): boolean =>
        (s[0] === corner[0] && s[1] === 3) || (s[3] === corner[0] && s[4] === 3),
    ),
  );
  edges.restore();

  // 5. Only asked kinds.
  const absent: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: torn,
    request: InspectionScene.ask({ marks: ["defect/degenerate"] }),
  });
  TestValidator.equals(
    "a kind that is not found draws nothing",
    [InspectionScene.strokes(torn).length, absent.legend],
    [0, []],
  );
  absent.restore();
}
