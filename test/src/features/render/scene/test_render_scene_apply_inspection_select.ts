import { markAutoMovieConstructionCurves } from "@automovie/engine";
import type { IAutoMovieMark } from "@automovie/interface";
import {
  type IAutoMovieInspectionHandle,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../../internal/InspectionScene";

/**
 * One path grammar selects objects and marks alike, because a mark's path
 * extends the path of the object it belongs to.
 *
 * Scenarios:
 *
 * 1. `parts` naming one section curve of a form, `hero/torso/section/1`, draws
 *    that curve alone, takes the form's surface off its layers, and records
 *    only that path.
 * 2. `parts` naming the form's object, `hero`, selects the object and every curve
 *    under its path, and records them all.
 * 3. A `parts`, `hide`, `label` or `color` pattern that matches no object, mark or
 *    kind is refused, leaving the scene as it was.
 */
export function test_render_scene_apply_inspection_select(): void {
  const hero: THREE.Mesh = InspectionScene.quad("hero");
  const stage: THREE.Scene = InspectionScene.scene(hero);
  const ring = (n: number, z: number) => ({
    id: `torso/section/${n}`,
    kind: "section" as const,
    part: "torso",
    closed: true,
    points: [0, 0, z, 1, 0, z, 0, 1, z],
    flagged: false,
  });
  const marks: IAutoMovieMark[] = markAutoMovieConstructionCurves(
    [ring(0, 0), ring(1, 1), ring(2, 2)],
    "hero",
  );

  // 1. One curve.
  const one: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({
      parts: ["hero/torso/section/1"],
      marks: ["curve"],
    }),
    marks,
  });
  TestValidator.equals(
    "one curve alone",
    [
      InspectionScene.segments(InspectionScene.strokes(stage)[0]!).map(
        (s: number[]): number => s[2]!,
      ),
      hero.layers.mask,
      one.selected,
    ],
    [[1, 1, 1], 0, ["hero/torso/section/1"]],
  );
  one.restore();

  // 2. The object and its marks.
  const whole: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({ parts: ["hero"], marks: ["curve"] }),
    marks,
  });
  TestValidator.equals(
    "the object brings its marks",
    [
      InspectionScene.segments(InspectionScene.strokes(stage)[0]!).length,
      hero.layers.mask,
      whole.selected,
    ],
    [
      9,
      1,
      [
        "hero",
        "hero/torso/section/0",
        "hero/torso/section/1",
        "hero/torso/section/2",
      ],
    ],
  );
  whole.restore();

  // 3. Patterns matching nothing.
  for (const changes of [
    { parts: ["hero/torso/section/9"] },
    { hide: ["villain"] },
    { label: ["villain"] },
    { color: [{ pattern: "villain", color: 0x123456 }] },
  ])
    TestValidator.error(`${JSON.stringify(changes)} is refused`, (): void => {
      applyAutoMovieInspection({
        scene: stage,
        request: InspectionScene.ask({ marks: ["curve"], ...changes }),
        marks,
      });
    });
  TestValidator.equals(
    "the refusals leave the scene",
    [stage.children.length, hero.layers.mask],
    [1, 1],
  );
}
