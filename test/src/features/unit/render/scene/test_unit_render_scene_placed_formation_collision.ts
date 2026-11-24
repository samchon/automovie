import { preparePhysicalGeometry } from "@automovie/engine";
import type {
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieFormationChunk,
} from "@automovie/interface";
import {
  buildInstancedFormation,
  observeAutoMovieSceneCollision,
  regenerateFormationSlot,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFormationShadowInputs } from "../../../internal/createFormationShadowInputs";

/**
 * Read the members a compiled formation actually draws as collision parts.
 *
 * 1. A static and a bobbing formation are built by the ordinary instanced
 *    generator. A barrier enclosing every member's whole reach confirms each
 *    drawn anonymous slot by its generator slot number, and member pairs are
 *    excluded as one managed formation.
 * 2. The same members beside a distant barrier yield no finding.
 */
export async function test_unit_render_scene_placed_formation_collision(): Promise<void> {
  const geometry: Geometry.IQueries = await preparePhysicalGeometry();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    45,
    16 / 9,
    0.1,
    200,
  );
  camera.position.set(0, 2, 12);
  camera.lookAt(0, 1, 0);
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  for (const cyclic of [false, true]) {
    const input = createFormationShadowInputs(3, cyclic);
    const formation = buildInstancedFormation(input);
    const scene: THREE.Scene = new THREE.Scene();
    scene.add(formation.object);
    formation.update(camera, 720, 0.3, undefined);
    const slots: string[] = input.formation.chunks
      .flatMap((chunk: IAutoMovieFormationChunk): number[] =>
        Array.from({ length: chunk.count }, (_, i) => chunk.start + i),
      )
      .map((slot) => regenerateFormationSlot(input.formation, slot).slot)
      .map((slot) => `formation:${input.formation.id}/slot/${slot}`)
      .sort(compareText);
    const barrier: THREE.Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(20, 20, 20),
      material,
    );
    barrier.name = "barrier";
    scene.add(barrier);
    const observe = (): Pick<Diagnostic, "findings" | "coverage"> => {
      scene.updateMatrixWorld(true);
      return observeAutoMovieSceneCollision({
        time: { filmSeconds: 0.3 },
        layers: [{ id: "main", root: scene, localSeconds: 0.3 }],
        geometry,
        limits: {
          comparisons: 100_000,
          posedVertices: 100_000,
          surfaceTriangles: 10_000_000,
          sweptCells: 0,
        },
      });
    };
    const inside = observe();
    TestValidator.equals(
      `${cyclic ? "cycle" : "static"} members are confirmed by slot`,
      inside.findings
        .filter(({ confidence }) => confidence === "confirmed")
        .map(({ paths }) => paths[1]!)
        .sort(compareText),
      slots,
    );
    TestValidator.predicate(
      `${cyclic ? "cycle" : "static"} member pairs stay inside their formation`,
      inside.findings.every(({ paths }) => paths[0] === "barrier") &&
        inside.coverage.some(
          ({ key, status }) =>
            key ===
              JSON.stringify([
                "main",
                "group",
                "managed-formation",
                input.formation.id,
              ]) && status === "excluded",
        ),
    );
    barrier.position.set(100, 0, 0);
    TestValidator.equals(
      `${cyclic ? "cycle" : "static"} members beside a distant barrier`,
      observe().findings,
      [],
    );
    barrier.geometry.dispose();
    formation.dispose();
  }
  material.dispose();
}

/** Order paths by code unit, independent of locale. */
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
