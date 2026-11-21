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

import { createFormationShadowInputs } from "../internal/createFormationShadowInputs";

/**
 * Read the members a compiled formation actually draws as collision parts.
 *
 * 1. A static and a bobbing formation are built by the ordinary instanced
 *    generator. A barrier enclosing every member's whole reach confirms each
 *    drawn anonymous slot by its generator slot number, and member pairs are
 *    excluded as one managed formation.
 * 2. The same members beside a distant barrier yield no finding.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the generator, the slot identity and the two barrier placements.
 * @evidence contracts/development/testing.md#behavioral-verification Builds and updates real instanced formations, then asserts the public observer's findings and coverage.
 * @evidence contracts/development/testing.md#independent-expectations Expected slot numbers come from regenerating the compiled chunks; the enclosing barrier is ten metres on each side around the anchor while the members move within a few metres.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates the static tier from the cycle-posed tier, and the enclosing barrier from the distant one.
 * @evidence contracts/development/testing.md#execution-ownership test_render_placed_formation_collision owns CPU-side Three objects and the geometry query, and disposes the formation.
 */
export async function test_render_placed_formation_collision(): Promise<void> {
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
