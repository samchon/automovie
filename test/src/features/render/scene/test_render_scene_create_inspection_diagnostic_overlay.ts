import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionLegendEntry,
} from "@automovie/interface";
import { type IAutoMovieInspectionDiagnosticOverlay, AutoMovieRenderInspectionOverlay } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * A kept witness overlay moves its cubes in place while their colours repeat,
 * rebuilds them when the colours change, and is attached only while the picture
 * renders.
 *
 * Scenarios:
 *
 * 1. Two pictures with one confirmed witness at different points render the same
 *    overlay object, whose first cube edge starts half a side below each
 *    picture's point, and the scene holds no overlay after either render.
 * 2. A picture that adds a possible witness renders a new overlay object with a
 *    red and an amber legend entry.
 * 3. A picture with no located witness renders the scene alone and returns no
 *    legend; dispose leaves nothing attached.
 */
export function test_render_scene_create_inspection_diagnostic_overlay(): void {
  const scene: THREE.Scene = new THREE.Scene();
  const overlay: IAutoMovieInspectionDiagnosticOverlay =
    AutoMovieRenderInspectionOverlay.createDiagnosticOverlay();
  const seen: { object: THREE.Object3D | undefined; start: number }[] = [];
  const draw: (
    points: { x: number; confidence: "confirmed" | "candidate" }[],
  ) => IAutoMovieInspectionLegendEntry[] = (
    points: { x: number; confidence: "confirmed" | "candidate" }[],
  ): IAutoMovieInspectionLegendEntry[] =>
    overlay.render({
      scene,
      diagnostics: packet(points),
      width: 640,
      height: 360,
      stroke: 2,
      render: (): void => {
        const object: THREE.Object3D | undefined = scene.children.at(-1);
        seen.push({ object, start: firstStart(object) });
      },
    });

  // 1. Moved in place.
  draw([{ x: 1, confidence: "confirmed" }]);
  TestValidator.equals("detached after the first", scene.children.length, 0);
  draw([{ x: 2, confidence: "confirmed" }]);
  TestValidator.predicate(
    "the same cubes move to the new witness and leave the scene",
    seen[0]!.object !== undefined &&
      seen[1]!.object === seen[0]!.object &&
      Math.abs(seen[0]!.start - (1 - 0.025)) < 1e-6 &&
      Math.abs(seen[1]!.start - (2 - 0.025)) < 1e-6 &&
      scene.children.length === 0,
  );

  // 2. Rebuilt for another colour sequence.
  const legend: IAutoMovieInspectionLegendEntry[] = draw([
    { x: 2, confidence: "confirmed" },
    { x: 3, confidence: "candidate" },
  ]);
  TestValidator.predicate(
    "an added witness rebuilds the cubes with both legend entries",
    seen[2]!.object !== seen[1]!.object &&
      legend
        .map(
          (entry: IAutoMovieInspectionLegendEntry): string =>
            `${entry.color}:${entry.count}`,
        )
        .join() === `${0xff0000}:1,${0xe6a300}:1`,
  );

  // 3. Nothing located.
  TestValidator.equals("no witness, no legend", draw([]), []);
  overlay.dispose();
  overlay.dispose();
  TestValidator.equals("nothing stays attached", scene.children.length, 0);
}

/** The lowest x the drawn overlay reaches, or zero when nothing is drawn. */
function firstStart(object: THREE.Object3D | undefined): number {
  return object === undefined
    ? 0
    : new THREE.Box3().setFromObject(object).min.x;
}

/** One placed sample at 1 s with a collision finding per point. */
function packet(
  points: { x: number; confidence: "confirmed" | "candidate" }[],
): IAutoMovieInspectionDiagnostics {
  return {
    scope: "s",
    time: { filmSeconds: 1 },
    coverage: [],
    findings: points.map(
      (
        point: { x: number; confidence: "confirmed" | "candidate" },
        index: number,
      ): IAutoMovieInspectionDiagnostics.IFinding => ({
        check: "collision",
        key: `k${index}`,
        code: "scene-penetration",
        paths: [`a${index}`],
        category: "error",
        confidence: point.confidence,
        message: "Overlap.",
        witness: { point: { x: point.x, y: 0, z: 0 } },
      }),
    ),
  };
}
