import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieInspectionRequest,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * Mesh edges are a measured mark kind, `edge`, drawn over any shade or alone, on the selected meshes only, once per triangle side, and an inspection that draws them changes no material flag.
 *
 * Scenarios:
 *
 * 1. `marks=edge` on a cube under the clay shade keeps the clay faces on their layer and draws the cube's 18 distinct triangle sides, its 12 edges and 6 face diagonals, in the edge colour, counted as one `mesh edge` mark.
 * 2. With `surface` off the cube's faces are taken off every layer and the same 18 sides are drawn alone.
 * 3. With two cubes and `parts` naming one, only that cube's sides are drawn.
 * 4. `edge` together with `defect/open` on a quad draws its 5 sides in the edge colour and its 4 boundary edges in the open edge red, both listed in the legend.
 * 5. An indexed cube and the same cube made non-indexed give the same set of sides.
 * 6. While and after edges are drawn, no material's `wireframe` flag changes, and `restore` leaves the scene with its own children.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection to cubes and a quad and reads the line objects it adds, their world-space ends and colours, the layer masks, the legend, and the materials' wireframe flags.
 * @evidence contracts/development/testing.md#independent-expectations A box of one segment per side has 12 edges and 12 triangles whose diagonals add 6 sides, and a quad 4 edges and one diagonal, counted by hand; colours are the palette's documented values.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts surfaces on against off, a selected cube against an unselected one, edges against open edges, indexed against non-indexed storage, and flags during against after. Defect measurement belongs to `test_inspection_mark_curves_defects`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own meshes and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: marks=edge on a cube under the clay shade keeps the clay faces on their layer).
 */
export function test_inspection_edges(): void {
  const EDGE: number = 0x2b3a67;
  const cube = (name: string, x: number = 0, indexed: boolean = true): THREE.Mesh => {
    const geometry: THREE.BufferGeometry = new THREE.BoxGeometry(1, 1, 1);
    const mesh: THREE.Mesh = new THREE.Mesh(
      indexed ? geometry : geometry.toNonIndexed(),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    );
    mesh.name = name;
    mesh.position.x = x;
    return mesh;
  };
  const sides = (stage: THREE.Scene): string[] =>
    InspectionScene.strokes(stage)
      .flatMap((line) => InspectionScene.segments(line))
      .map((s: number[]): string =>
        [s.slice(0, 3), s.slice(3)]
          .map((p: number[]): string => p.map((v: number): string => v.toFixed(4)).join(","))
          .sort((a: string, b: string): number => a.localeCompare(b))
          .join("|"),
      )
      .sort((a: string, b: string): number => a.localeCompare(b));
  const apply = (stage: THREE.Scene, changes: Partial<IAutoMovieInspectionRequest>): IAutoMovieInspectionHandle =>
    applyAutoMovieInspection({ scene: stage, request: InspectionScene.ask(changes) });

  // 1. Over the clay shade.
  const box: THREE.Mesh = cube("box");
  const stage: THREE.Scene = InspectionScene.scene(box);
  const over: IAutoMovieInspectionHandle = apply(stage, { marks: ["edge"], shade: "clay" });
  TestValidator.equals(
    "the faces stay and 18 sides are drawn in the edge colour",
    [
      box.layers.mask,
      (box.material as THREE.Material).type,
      sides(stage).length,
      [...new Set(InspectionScene.colors(InspectionScene.strokes(stage)[0]!))],
      over.legend,
      over.selected,
    ],
    [1, "MeshLambertMaterial", 18, [EDGE], [{ label: "mesh edge", color: EDGE, count: 1 }], ["box", "box/edge"]],
  );
  const drawnSides: string[] = sides(stage);
  over.restore();

  // 2. Alone.
  const alone: IAutoMovieInspectionHandle = apply(stage, { marks: ["edge"], surface: false });
  TestValidator.equals("with surfaces off the sides are drawn alone", [box.layers.mask, sides(stage)], [0, drawnSides]);
  alone.restore();

  // 3. A part selection.
  const pair: THREE.Scene = InspectionScene.scene(cube("near"), cube("far", 5));
  const near: IAutoMovieInspectionHandle = apply(pair, { marks: ["edge"], parts: ["near"] });
  TestValidator.predicate(
    "only the selected cube has edges",
    sides(pair).length === 18 && InspectionScene.strokes(pair).every((line) => InspectionScene.segments(line).every((s: number[]): boolean => s[0]! < 1 && s[3]! < 1)),
  );
  near.restore();

  // 4. Edges and open edges.
  const sheet: THREE.Scene = InspectionScene.scene(InspectionScene.quad("sheet"));
  const both: IAutoMovieInspectionHandle = apply(sheet, { marks: ["edge", "defect/open"] });
  const colours: number[] = InspectionScene.strokes(sheet).flatMap((line) => InspectionScene.colors(line));
  TestValidator.equals(
    "both kinds are drawn in their own colours and listed",
    [
      colours.filter((c: number): boolean => c === EDGE).length,
      colours.filter((c: number): boolean => c === 0xff3b30).length,
      both.legend,
    ],
    [
      5,
      4,
      [
        { label: "mesh edge", color: EDGE, count: 1 },
        { label: "open edge", color: 0xff3b30, count: 4 },
      ],
    ],
  );
  both.restore();

  // 5. Indexed and non-indexed.
  const loose: THREE.Scene = InspectionScene.scene(cube("box", 0, false));
  const unindexed: IAutoMovieInspectionHandle = apply(loose, { marks: ["edge"] });
  TestValidator.equals("a non-indexed cube has the same sides", sides(loose), drawnSides);
  unindexed.restore();

  // 6. No flag changes.
  const flags = (): boolean[] => [stage, loose].flatMap((scene: THREE.Scene) => {
    const out: boolean[] = [];
    scene.traverse((object: THREE.Object3D): void => {
      const material: unknown = (object as THREE.Mesh).material;
      if (material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshLambertMaterial) out.push(material.wireframe);
    });
    return out;
  });
  const during: IAutoMovieInspectionHandle = apply(stage, { marks: ["edge"] });
  TestValidator.equals("no wireframe flag is set while edges are drawn", flags().includes(true), false);
  during.restore();
  TestValidator.equals("nor after, and the scene has its own children", [flags().includes(true), stage.children.length], [false, 1]);
}
