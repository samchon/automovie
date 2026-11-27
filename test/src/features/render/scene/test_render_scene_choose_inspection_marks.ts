import type { IAutoMovieMark } from "@automovie/interface";
import { AutoMovieRenderInspectionMarks } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspectionMarks.choose` keeps the marks an inspection asks for.
 *
 * Scenarios:
 *
 * 1. A mark is kept when its kind is asked for and its path is selected; kept
 *    marks are grouped by the object they follow, `null` for none.
 * 2. A mark that follows a hidden or invisible object is dropped.
 * 3. A mark that follows an object the scene does not have is refused.
 */
export function test_render_scene_choose_inspection_marks(): void {
  const mark = (path: string, kind: string, anchor: string | null): IAutoMovieMark => ({
    path,
    kind,
    label: kind,
    color: 0,
    shape: { type: "points", points: [0, 0, 0] },
    flagged: false,
    anchor,
  });
  const arm: THREE.Object3D = new THREE.Object3D();
  const gone: THREE.Object3D = new THREE.Object3D();
  gone.visible = false;
  const anchors: Map<string, THREE.Object3D> = new Map([
    ["hero/arm", arm],
    ["hero/gone", gone],
  ]);
  const props = {
    asks: (kind: string): boolean => kind !== "ignored",
    selects: (path: string): boolean => path !== "skipped",
    hidden: (path: string): boolean => path === "hero/hidden",
    anchors,
  };
  const world: IAutoMovieMark = mark("a", "curve", null);
  const followed: IAutoMovieMark = mark("b", "curve", "hero/arm");
  const chosen = AutoMovieRenderInspectionMarks.choose({
    ...props,
    marks: [
      world,
      followed,
      mark("c", "ignored", null),
      mark("skipped", "curve", null),
      mark("d", "curve", "hero/gone"),
    ],
  });
  TestValidator.equals("kept", chosen.marks, [world, followed]);
  TestValidator.predicate(
    "grouped",
    chosen.sets.get(null)?.[0] === world && chosen.sets.get(arm)?.[0] === followed,
  );
  TestValidator.equals(
    "hidden anchor",
    AutoMovieRenderInspectionMarks.choose({
      ...props,
      anchors: new Map([["hero/hidden", arm]]),
      marks: [mark("e", "curve", "hero/hidden")],
    }).marks,
    [],
  );
  TestValidator.error("unknown anchor", (): void => {
    AutoMovieRenderInspectionMarks.choose({
      ...props,
      marks: [mark("f", "curve", "nowhere")],
    });
  });
}