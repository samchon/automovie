import type {
  IAutoMovieConstructionCurve,
  IAutoMovieMeshDefect,
} from "@automovie/engine";
import {
  type IAutoMovieInspectionLegendEntry,
  type IAutoMovieInspectionOverlay,
  type IAutoMovieViewerSubjectBounds,
  buildAutoMovieInspectionCurves,
  buildAutoMovieInspectionDefects,
  measureAutoMovieInspectionBounds,
  mergeAutoMovieInspectionLegends,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Inspection marks are line segments built from construction curves and from
 * mesh defects, coloured by what they mark, counted in a legend, and placed
 * on the object they belong to; the bounds of an inspected scene are measured
 * on what it still draws.
 *
 * Scenarios:
 *
 * 1. Legends that repeat a label are merged into one entry per label in
 *    first-appearance order with the counts summed and fresh entries, and one
 *    label under two colours is refused.
 * 2. Five curves give one segment per consecutive point pair plus the closing
 *    segment of the closed one, each in its kind's colour or the flagged
 *    colour, a legend that counts curves, a material carrying the stroke and
 *    the x-ray choice, an overlay that takes its parent's world placement
 *    again after the parent moves, a refusal for points that are not two or
 *    more xyz triples, and a dispose that detaches and releases it.
 * 3. Two edge defects and two triangle defects on a quad give one segment
 *    per edge and three per triangle at the mesh's vertices in each kind's
 *    colour, a legend that separates edges from triangles, marks that follow
 *    the mesh's placement and its moved vertex after an update, and a
 *    refusal for a defect of one or four vertices or a vertex the mesh does
 *    not have.
 * 4. The bounds of a scene are the world box of its meshes, lines and
 *    points; an object off every layer and a hidden object are left out
 *    while a child of the former still counts, a sprite is not measured, and
 *    a scene with nothing drawn has no bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public legend, overlay and bounds functions on actual three.js objects and reads the returned buffers, legends, matrices and boxes.
 * @evidence contracts/development/testing.md#independent-expectations Expected segments are counted from the authored points and defect vertices, expected colours are the documented palette's hex values, and expected placements and boxes come from authored positions and sizes.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts open against closed curves, flagged against plain, edges against triangles, x-ray against depth-tested, a stale placement against an updated one, and drawn against isolated or hidden objects.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own objects and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Legends that repeat a label are merged into one entry per label in first-appearance order).
 */
export function test_viewer_inspection_marks(): void {
  const vertex = (overlay: IAutoMovieInspectionOverlay, i: number): number[] =>
    Array.from(overlay.object.geometry.getAttribute("position").array).slice(
      i * 3,
      i * 3 + 3,
    );
  const tint = (overlay: IAutoMovieInspectionOverlay, i: number): number => {
    const colors: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      overlay.object.geometry.getAttribute("color");
    return new THREE.Color(
      colors.getX(i),
      colors.getY(i),
      colors.getZ(i),
    ).getHex();
  };
  const close = (title: string, actual: number[], expected: number[]): void =>
    TestValidator.predicate(
      `${title}: ${actual.join(",")} equals ${expected.join(",")}`,
      actual.length === expected.length &&
        actual.every(
          (value: number, i: number): boolean =>
            Math.abs(value - expected[i]!) <= 1e-9,
        ),
    );
  const box = (bounds: IAutoMovieViewerSubjectBounds | null): number[] =>
    bounds === null
      ? []
      : [
          bounds.min.x,
          bounds.min.y,
          bounds.min.z,
          bounds.max.x,
          bounds.max.y,
          bounds.max.z,
        ];
  const quad = (x: number): THREE.Mesh => {
    const mesh: THREE.Mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial(),
    );
    mesh.position.x = x;
    return mesh;
  };

  // 1. Merging legends.
  const first: IAutoMovieInspectionLegendEntry = {
    label: "open edge",
    color: 0xff3b30,
    count: 2,
  };
  const merged: IAutoMovieInspectionLegendEntry[] =
    mergeAutoMovieInspectionLegends([
      [first, { label: "guide curve", color: 0x59cb89, count: 1 }],
      [],
      [
        { label: "guide curve", color: 0x59cb89, count: 4 },
        { label: "axis curve", color: 0x00e5ff, count: 1 },
        { label: "open edge", color: 0xff3b30, count: 3 },
      ],
    ]);
  TestValidator.equals("counts are summed by label, in first order", merged, [
    { label: "open edge", color: 0xff3b30, count: 5 },
    { label: "guide curve", color: 0x59cb89, count: 5 },
    { label: "axis curve", color: 0x00e5ff, count: 1 },
  ]);
  TestValidator.equals("the merged entries are fresh", first.count, 2);
  TestValidator.equals(
    "no legend merges to none",
    mergeAutoMovieInspectionLegends([]),
    [],
  );
  TestValidator.error("one label under two colours is refused", (): void => {
    mergeAutoMovieInspectionLegends([
      [{ label: "open edge", color: 0xff3b30, count: 1 }],
      [{ label: "open edge", color: 0xffffff, count: 1 }],
    ]);
  });

  // 2. Curves.
  const curve = (
    id: string,
    kind: IAutoMovieConstructionCurve.Kind,
    points: number[],
    closed: boolean = false,
    flagged: boolean = false,
  ): IAutoMovieConstructionCurve => ({
    id,
    kind,
    part: id,
    closed,
    points,
    flagged,
  });
  const curves: IAutoMovieConstructionCurve[] = [
    curve("guide-a", "guide", [0, 0, 0, 1, 0, 0, 1, 1, 0]),
    curve("ring", "section", [0, 0, 1, 1, 0, 1, 0, 1, 1], true),
    curve("guide-b", "guide", [0, 0, 2, 1, 0, 2]),
    curve("spine", "axis", [0, 0, 3, 0, 1, 3]),
    curve("bent", "axis", [0, 0, 4, 0, 1, 4], false, true),
  ];
  const source: THREE.Group = new THREE.Group();
  source.position.set(3, 0, 0);
  const holder: THREE.Group = new THREE.Group();
  holder.position.set(10, 0, 0);
  const stage: THREE.Scene = new THREE.Scene();
  stage.add(source, holder);
  const drawn: IAutoMovieInspectionOverlay = buildAutoMovieInspectionCurves(
    { parent: source, curves },
    { stroke: 4, xray: false },
  );
  holder.add(drawn.object);
  stage.updateMatrixWorld();
  drawn.update();
  TestValidator.equals(
    "five curves of 3, 3 closed, 2, 2 and 2 points give 8 segments",
    drawn.object.geometry.getAttribute("position").count,
    16,
  );
  TestValidator.equals(
    "an open curve starts at its first point",
    vertex(drawn, 0),
    [0, 0, 0],
  );
  TestValidator.equals(
    "and ends at its last point",
    vertex(drawn, 3),
    [1, 1, 0],
  );
  TestValidator.equals(
    "a closed curve's last segment leaves its last point",
    vertex(drawn, 8),
    [0, 1, 1],
  );
  TestValidator.equals(
    "and returns to its first point",
    vertex(drawn, 9),
    [0, 0, 1],
  );
  TestValidator.equals(
    "each curve is drawn in its kind's colour, or the flagged colour",
    [0, 4, 10, 12, 14].map((i: number): number => tint(drawn, i)),
    [0x59cb89, 0x59a0f4, 0x59cb89, 0x00e5ff, 0xff00ff],
  );
  TestValidator.equals("the legend counts curves", drawn.legend, [
    { label: "guide curve", color: 0x59cb89, count: 2 },
    { label: "section curve", color: 0x59a0f4, count: 1 },
    { label: "axis curve", color: 0x00e5ff, count: 1 },
    { label: "flagged curve", color: 0xff00ff, count: 1 },
  ]);
  const solid: THREE.LineBasicMaterial = drawn.object
    .material as THREE.LineBasicMaterial;
  TestValidator.equals(
    "the material carries the stroke and tests depth",
    [solid.linewidth, solid.vertexColors, solid.depthTest],
    [4, true, true],
  );
  const through: IAutoMovieInspectionOverlay = buildAutoMovieInspectionCurves(
    { parent: source, curves },
    { stroke: 2, xray: true },
  );
  const ghost: THREE.LineBasicMaterial = through.object
    .material as THREE.LineBasicMaterial;
  TestValidator.equals(
    "an x-ray overlay ignores depth and draws last",
    [ghost.linewidth, ghost.depthTest, ghost.depthWrite],
    [2, false, false],
  );
  TestValidator.predicate(
    "an x-ray overlay is ordered after a depth-tested one",
    through.object.renderOrder > drawn.object.renderOrder,
  );
  close(
    "the overlay takes its parent's world placement",
    drawn.object.matrixWorld.toArray(),
    source.matrixWorld.toArray(),
  );
  source.position.set(3, 2, 0);
  source.rotation.z = Math.PI / 2;
  stage.updateMatrixWorld();
  TestValidator.equals(
    "before an update the overlay stays where it was",
    drawn.object.matrixWorld.elements[13],
    0,
  );
  drawn.update();
  close(
    "after an update it follows the moved parent",
    drawn.object.matrixWorld.toArray(),
    source.matrixWorld.toArray(),
  );
  TestValidator.equals(
    "the moved parent is two metres up",
    drawn.object.matrixWorld.elements[13],
    2,
  );
  TestValidator.error(
    "points that are not whole triples are refused",
    (): void => {
      buildAutoMovieInspectionCurves(
        { parent: source, curves: [curve("short", "guide", [0, 0, 0, 1, 0])] },
        { stroke: 3, xray: false },
      );
    },
  );
  TestValidator.error("a single point is refused", (): void => {
    buildAutoMovieInspectionCurves(
      { parent: source, curves: [curve("dot", "guide", [0, 0, 0])] },
      { stroke: 3, xray: false },
    );
  });
  const released: string[] = [];
  drawn.object.geometry.addEventListener("dispose", (): void => {
    released.push("geometry");
  });
  solid.addEventListener("dispose", (): void => {
    released.push("material");
  });
  drawn.dispose();
  TestValidator.equals(
    "dispose detaches the overlay and releases its geometry and material",
    [drawn.object.parent, holder.children.length, released],
    [null, 0, ["geometry", "material"]],
  );

  // 3. Defects.
  const defect = (
    kind: IAutoMovieMeshDefect.Kind,
    vertices: number[],
  ): IAutoMovieMeshDefect => ({ kind, vertices });
  // A 2 m quad's vertices: 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right.
  const mesh: THREE.Mesh = quad(0);
  mesh.name = "panel";
  const shelf: THREE.Group = new THREE.Group();
  shelf.position.set(10, 0, 0);
  const room: THREE.Scene = new THREE.Scene();
  room.add(mesh, shelf);
  const marks: IAutoMovieInspectionOverlay = buildAutoMovieInspectionDefects(
    mesh,
    [
      defect("open", [0, 1]),
      defect("degenerate", [0, 2, 1]),
      defect("open", [2, 3]),
      defect("sliver", [1, 2, 3]),
    ],
    { stroke: 3, xray: false },
  );
  shelf.add(marks.object);
  room.updateMatrixWorld();
  marks.update();
  TestValidator.equals(
    "two edges and two triangles give 8 segments",
    marks.object.geometry.getAttribute("position").count,
    16,
  );
  TestValidator.equals(
    "an edge is one segment between its two vertices",
    [vertex(marks, 0), vertex(marks, 1)],
    [
      [-1, 1, 0],
      [1, 1, 0],
    ],
  );
  TestValidator.equals(
    "a triangle is three segments around its vertices",
    [2, 3, 4, 5, 6, 7].map((i: number): number[] => vertex(marks, i)),
    [
      [-1, 1, 0],
      [-1, -1, 0],
      [-1, -1, 0],
      [1, 1, 0],
      [1, 1, 0],
      [-1, 1, 0],
    ],
  );
  TestValidator.equals(
    "each defect is drawn in its kind's colour",
    [0, 2, 8, 10].map((i: number): number => tint(marks, i)),
    [0xff3b30, 0xffffff, 0xff3b30, 0xff9500],
  );
  TestValidator.equals(
    "the legend separates edges from triangles",
    marks.legend,
    [
      { label: "open edge", color: 0xff3b30, count: 2 },
      { label: "degenerate triangle", color: 0xffffff, count: 1 },
      { label: "sliver triangle", color: 0xff9500, count: 1 },
    ],
  );
  close(
    "the marks take the mesh's world placement",
    marks.object.matrixWorld.toArray(),
    mesh.matrixWorld.toArray(),
  );
  mesh.position.set(0, 2, 0);
  mesh.geometry.getAttribute("position").setY(0, 3);
  room.updateMatrixWorld();
  marks.update();
  close(
    "after an update the marks follow the moved mesh",
    marks.object.matrixWorld.toArray(),
    mesh.matrixWorld.toArray(),
  );
  TestValidator.equals(
    "the moved mesh is two metres up",
    marks.object.matrixWorld.elements[13],
    2,
  );
  TestValidator.equals(
    "and its moved vertex is where the mesh now has it",
    vertex(marks, 0),
    [-1, 3, 0],
  );
  const invalid: [title: string, vertices: number[]][] = [
    ["a defect of one vertex", [0]],
    ["a defect of four vertices", [0, 1, 2, 3]],
    ["a vertex past the mesh's last", [0, 4]],
    ["a negative vertex", [0, -1]],
    ["a fractional vertex", [0, 1.5]],
  ];
  for (const [title, vertices] of invalid)
    TestValidator.error(`${title} is refused`, (): void => {
      buildAutoMovieInspectionDefects(mesh, [defect("open", vertices)], {
        stroke: 3,
        xray: false,
      });
    });

  // 4. Bounds.
  const isolated: THREE.Mesh = quad(100);
  isolated.layers.mask = 0;
  const invisible: THREE.Mesh = quad(-100);
  invisible.visible = false;
  const lit: THREE.Scene = new THREE.Scene();
  lit.add(quad(3), isolated, invisible, new THREE.Group());
  TestValidator.equals(
    "the bounds are the drawn mesh's world box",
    box(measureAutoMovieInspectionBounds(lit)),
    [2, -1, 0, 4, 1, 0],
  );
  isolated.add(quad(-95));
  TestValidator.equals(
    "a child of an object off every layer still counts",
    box(measureAutoMovieInspectionBounds(lit)),
    [2, -1, 0, 6, 1, 0],
  );
  const strokes: THREE.Scene = new THREE.Scene();
  const sprite: THREE.Sprite = new THREE.Sprite();
  sprite.position.set(50, 0, 0);
  strokes.add(
    new THREE.Line(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute([0, 5, 0, 0, 6, 0], 3),
      ),
    ),
    new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute([1, 0, -2], 3),
      ),
    ),
    sprite,
  );
  TestValidator.equals(
    "lines and points are measured and a sprite is not",
    box(measureAutoMovieInspectionBounds(strokes)),
    [0, 0, -2, 1, 6, 0],
  );
  const empty: THREE.Scene = new THREE.Scene();
  empty.add(new THREE.Group().add(new THREE.Group()));
  TestValidator.equals(
    "a scene of groups has no bounds",
    measureAutoMovieInspectionBounds(empty),
    null,
  );
  const dark: THREE.Scene = new THREE.Scene();
  const only: THREE.Mesh = quad(0);
  only.layers.mask = 0;
  dark.add(only);
  TestValidator.equals(
    "a scene whose only mesh is off every layer has no bounds",
    measureAutoMovieInspectionBounds(dark),
    null,
  );
}
