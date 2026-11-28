import { AutoMovieEngineConstruction } from "@automovie/engine";
import type { IAutoMovieMark } from "@automovie/interface";
import { type IAutoMovieRenderInspectionHandle, AutoMovieRenderInspection } from "@automovie/render";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the distinct selection of one construction curve and all descendants, plus unmatched request refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Creates three construction curves on one named mesh. Calls inspection with an exact curve path and then the object path. Reads emitted segments and selected paths and executes four unmatched request forms.
 * @evidence contracts/development/testing.md#independent-expectations The middle triangle is authored at Z 1 and gives three sides. Selecting the whole object must include three triangles for nine sides, and the original surface stays on layer 1. Invalid requests leave the original scene with one child.
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
  const marks: IAutoMovieMark[] = AutoMovieEngineConstruction.markConstructionCurves(
    [ring(0, 0), ring(1, 1), ring(2, 2)],
    "hero",
  );

  // 1. One curve.
  const one: IAutoMovieRenderInspectionHandle = AutoMovieRenderInspection.apply({
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
  const whole: IAutoMovieRenderInspectionHandle = AutoMovieRenderInspection.apply({
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
      AutoMovieRenderInspection.apply({
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
