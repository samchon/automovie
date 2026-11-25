import { preparePhysicalGeometry } from "@automovie/engine";
import { observeAutoMovieCollisionMotion } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `observeAutoMovieCollisionMotion` searches the span between two placed
 * instants for the first contact of moving meshes.
 *
 * Scenarios:
 *
 * 1. A box that stays 3 m from another through the span gives no finding.
 * 2. A box that travels from 3 m to -3 m, clear at both instants but through the
 *    other box between them, gives a finding; contact at an instant itself is
 *    left to the placed-frame observation.
 */
export async function test_unit_render_scene_observe_collision_motion(): Promise<void> {
  const geometry = await preparePhysicalGeometry();
  const run = (endX: number) => {
    const root: THREE.Scene = new THREE.Scene();
    const still: THREE.Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    const mover: THREE.Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    still.name = "still";
    mover.name = "mover";
    root.add(still, mover);
    const place = (seconds: number): void => {
      mover.position.x = 3 + (endX - 3) * seconds;
      root.updateMatrixWorld(true);
    };
    // The drawn instant is the one already placed when the span is observed.
    place(1);
    const spent = {
      placements: 0,
      depth: 0,
      comparisons: 0,
      posedVertices: 0,
      surfaceTriangles: 0,
    };
    const result = observeAutoMovieCollisionMotion({
      time: { filmSeconds: 1 },
      fromSeconds: 0,
      continuous: true,
      place,
      layers: (seconds: number) => [{ id: "main", root, localSeconds: seconds }],
      geometry,
      limits: {
        placements: 64,
        depth: 8,
        comparisons: 12_000,
        posedVertices: 100_000,
        surfaceTriangles: 1_000_000,
      },
      spent,
    });
    return result.findings.length;
  };
  TestValidator.equals("no motion", run(3), 0);
  TestValidator.predicate("motion through the other box", run(-3) > 0);
}