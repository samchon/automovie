import { AutoMovieEnginePhysicalGeometry } from "@automovie/engine";
import type { IAutoMoviePreparePhysicalGeometry } from "@automovie/interface";
import { AutoMovieRenderInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspection.observePlacedSceneCollisions` finds the placed meshes that interpenetrate.
 *
 * Scenarios:
 *
 * 1. Two unit boxes 3 m apart give no finding, and the work spent is reported.
 * 2. Two unit boxes 0.5 m apart give at least one finding.
 */
export async function test_render_scene_observe_scene_collision(): Promise<void> {
  const geometry: IAutoMoviePreparePhysicalGeometry.IQueries =
    await AutoMovieEnginePhysicalGeometry.prepare();
  const observe = (gap: number): AutoMovieRenderInspection.IPlacedSceneCollisionResult & {
    spent: number;
  } => {
    const root: THREE.Scene = new THREE.Scene();
    for (const [name, x] of [
      ["left", 0],
      ["right", gap],
    ] as const) {
      const mesh: THREE.Mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial(),
      );
      mesh.name = name;
      mesh.position.x = x;
      root.add(mesh);
    }
    root.updateMatrixWorld(true);
    const limits = {
      comparisons: 12_000,
      posedVertices: 100_000,
      surfaceTriangles: 1_000_000,
      sweptCells: 1_000,
    };
    const spent = { comparisons: 0, posedVertices: 0, surfaceTriangles: 0, sweptCells: 0 };
    const result = AutoMovieRenderInspection.observePlacedSceneCollisions({
      time: { filmSeconds: 0 },
      layers: [{ id: "main", root, localSeconds: 0 }],
      geometry,
      limits,
      spent,
    });
    return { ...result, spent: spent.comparisons };
  };
  const apart = observe(3);
  TestValidator.equals("apart", apart.findings.length, 0);
  TestValidator.predicate("work spent", apart.spent > 0);
  TestValidator.predicate("overlap", observe(0.5).findings.length > 0);
}