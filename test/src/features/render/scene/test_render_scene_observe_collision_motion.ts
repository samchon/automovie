import { AutoMovieEnginePhysicalGeometry } from "@automovie/engine";
import {
  AutoMovieRenderInspection,
  AutoMovieRenderSkinnedMesh,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspection.observePlacedSceneCollisionMotion` searches the
 * span between two placed instants for the first contact of moving meshes.
 *
 * Scenarios:
 *
 * 1. A box that stays 3 m from another through the span gives no finding.
 * 2. A box that travels from 3 m to -3 m, clear at both instants but through the
 *    other box between them, gives a finding; contact at an instant itself is
 *    left to the placed-frame observation.
 * 3. A cached sphere-envelope pair needs the exact endpoint pose before its drawn
 *    surface can clear it. The replay may mount another scene with the same
 *    names. A stock skinned mover follows the same boundary.
 * 4. Exhausted replay budget is deferred, and only the drawn pose is restored.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes broad clearance, a crossing, lazy surface replay through a same-name replacement, and budget deferral.
 * @evidence contracts/development/testing.md#behavioral-verification Drives the public motion observer with exact boxes, then a closed sphere and rigid or stock-skinned mover, recording native scene placement and part names at every seek.
 * @evidence contracts/development/testing.md#independent-expectations A unit sphere and a 0.2 m mover centered at (0.85, 0.85, 0) have overlapping boxes but clear drawn surfaces. Their midpoint at (-0.575, 0.85, 0) intersects the sphere. Captured placement order and a one-placement limit distinguish an exact endpoint replay from stale triangulation.
 */
export async function test_render_scene_observe_collision_motion(): Promise<void> {
  const geometry = await AutoMovieEnginePhysicalGeometry.prepare();
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
    const result = AutoMovieRenderInspection.observePlacedSceneCollisionMotion({
      time: { filmSeconds: 1 },
      fromSeconds: 0,
      continuous: true,
      place,
      layers: (seconds: number) => [
        { id: "main", root, localSeconds: seconds },
      ],
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
    return { count: result.findings.length, placements: spent.placements };
  };
  TestValidator.equals("no motion", run(3), { count: 0, placements: 1 });
  TestValidator.predicate("motion through the other box", run(-3).count > 0);
  for (const skin of [false, true]) {
    const observed = envelopeEpisode(skin, 64);
    assert.deepEqual(observed.sought.slice(0, 4), [0, 1, 0.5, 1]);
    assert.equal(observed.finalX, 0.85);
    assert.equal(observed.spent, observed.sought.length - 1);
    assert(
      observed.result.findings.some(
        ({ paths, witness }) =>
          paths.includes("mover") &&
          paths.includes("sphere") &&
          witness.time?.filmSeconds === 0.5,
      ),
    );
  }
  const exhausted = envelopeEpisode(false, 1);
  assert.deepEqual(exhausted.sought, [0, 1]);
  assert.equal(exhausted.finalX, 0.85);
  assert.equal(exhausted.spent, 1);
  assert.deepEqual(exhausted.result.findings, []);
  assert(
    exhausted.result.coverage.some(
      (row) =>
        row.status === "deferred" && row.reason === "motion-placement-limit",
    ),
  );

  function envelopeEpisode(skin: boolean, placements: number) {
    const material = new THREE.MeshBasicMaterial();
    const moverGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const count = moverGeometry.getAttribute("position").count;
    moverGeometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(new Uint16Array(count * 4), 4),
    );
    const weights = new Float32Array(count * 4);
    for (let vertex = 0; vertex < count; vertex++) weights[vertex * 4] = 1;
    moverGeometry.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(weights, 4),
    );
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 16);
    const sought: number[] = [];
    let root = new THREE.Scene();
    let finalX: number = NaN;
    const place = (seconds: number): void => {
      sought.push(seconds);
      // Both the native scene and same-named mesh are replaced on every seek.
      root = new THREE.Scene();
      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.name = "sphere";
      root.add(sphere);
      const mover = skin
        ? new AutoMovieRenderSkinnedMesh(moverGeometry, material)
        : new THREE.Mesh(moverGeometry, material);
      mover.name = "mover";
      finalX = seconds === 1 ? 0.85 : -2 + 2.85 * seconds;
      mover.position.y = 0.85;
      root.add(mover);
      if (mover instanceof AutoMovieRenderSkinnedMesh) {
        const bone = new THREE.Bone();
        bone.name = "joint";
        mover.add(bone);
        root.updateMatrixWorld(true);
        mover.bind(new THREE.Skeleton([bone]));
        bone.position.x = finalX;
        mover.invalidatePose();
      } else mover.position.x = finalX;
      root.updateMatrixWorld(true);
    };
    place(1);
    sought.length = 0;
    const spent = {
      placements: 0,
      depth: 0,
      comparisons: 0,
      posedVertices: 0,
      surfaceTriangles: 0,
    };
    const result = AutoMovieRenderInspection.observePlacedSceneCollisionMotion({
      time: { filmSeconds: 1 },
      fromSeconds: 0,
      continuous: true,
      place,
      layers: (seconds) => [
        { id: "main", root, localSeconds: seconds, required: true },
      ],
      geometry,
      limits: {
        placements,
        depth: 8,
        comparisons: 12_000,
        posedVertices: 100_000,
        surfaceTriangles: 1_000_000,
      },
      spent,
    });
    material.dispose();
    moverGeometry.dispose();
    sphereGeometry.dispose();
    return { result, sought, finalX, spent: spent.placements };
  }
}
