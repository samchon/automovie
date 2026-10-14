import type { IAutoMovieCompiledFormation, IAutoMovieFormationSlot, IAutoMovieModel, IAutoMovieTransform } from "@automovie/interface";
import { materializeCompiledFormation } from "@automovie/engine";
import { buildInstancedFormation, regenerateFormationSlot } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as ThreeTypes from "three";

import { createFormationShadowInputs } from "../internal/createFormationShadowInputs";
import { nclose, qclose, vclose } from "../internal/predicates";

/**
 * Formation placement delegates arithmetic to the Engine, keeps instance coordinates local and copies promoted source transforms before use. The authored three-degree line supplies an independent rotated-lattice oracle.
 *
 * Scenarios:
 * 1. Default construction regenerates the rotated slots and writes anchor-relative coordinates without spacing or motion displacement.
 * 2. Doubled lateral spacing uses the designed heading before a quarter turn, while the root carries cue translation and rotation once.
 * 3. A promoted source's displacement, rotation and scale survive two updates without reading back the previously written transform.
 * 4. An explicit source snapshot supersedes the initial snapshot; release retains the host's promoted object and detaches anonymous resources.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds a formation with a promoted host-owned source and updates heading, spacing and source snapshots, then reads real world/local transforms and retained parent identity; catches duplicate placement application and feeding previously updated hero state back into the next seek.
 * @evidence contracts/testing.md#independent-expectations Hand-rotated lattice offsets, quarter-turn quaternion composition and literal source transforms define finite vector/quaternion expectations; the existing Engine formation supplies derived placement data and is not independently validated as a solver here.
 * @evidence contracts/testing.md#distinguishing-cases Covers initial source state, turning, changed spacing, repeated seeks, explicit replacement snapshot and final borrowed-node retention; anonymous formation shadow-resource failure belongs to its separate lifecycle tests.
 * @evidence contracts/testing.md#execution-ownership This named asynchronous unit calls existing source with the established generic formation fixture and actual CPU-side Three groups, disposes the formation owner and launches no renderer, browser, process or new Human figure.
 */
export async function test_viewer_formation_placement_source(): Promise<void> {
  const THREE: typeof ThreeTypes = await import("three");
  const input: ReturnType<typeof createFormationShadowInputs> = createFormationShadowInputs(3, false);
  const model: IAutoMovieModel = [...input.models.values()][0]!;
  const formation: IAutoMovieCompiledFormation = materializeCompiledFormation({
    formation: {
      id: "placement-unit", modelRecipe: "box", count: 3,
      layout: { kind: "line", files: 3, ranks: 1, spacing: { lateral: 2, depth: 1 } },
      anchor: { x: 10, y: 0, z: -3 }, facingDeg: 3, seed: 7,
      capabilities: [], heroOverrides: [{ slot: 1, actor: "promoted" }],
    },
    projectionRadii: new Map([["box", 3]]),
  });
  const state: { translation: { x: number; y: number; z: number; }; facingOffsetDeg: number; spacingScale: { lateral: number; depth: number; }; } = {
    translation: { x: 2, y: 0, z: 0 }, facingOffsetDeg: 90,
    spacingScale: { lateral: 2, depth: 3 },
  };
  input.formation = formation;
  input.models = new Map([[formation.lod[0]!.model, model]]);
  input.motions = [{
    id: "placement-cue", formation: formation.id, action: "hold", start: 0,
    end: 1, from: state, to: state, easing: "linear",
  }];
  const hero: ThreeTypes.Group<ThreeTypes.Object3DEventMap> = new THREE.Group();
  hero.position.set(11, 2, 0);
  hero.scale.set(2, 3, 4);
  const host: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> = new THREE.Scene();
  host.add(hero);
  input.heroObjects = new Map([["promoted", hero]]);
  const runtime: ReturnType<typeof buildInstancedFormation> = buildInstancedFormation(input);
  host.add(runtime.object);
  const mesh: ThreeTypes.InstancedMesh<ThreeTypes.BufferGeometry<ThreeTypes.NormalBufferAttributes, ThreeTypes.BufferGeometryEventMap>, ThreeTypes.Material<ThreeTypes.MaterialEventMap> | ThreeTypes.Material<ThreeTypes.MaterialEventMap>[], ThreeTypes.Object3DEventMap> = runtime.object.children[0] as ThreeTypes.InstancedMesh;
  TestValidator.equals("the promoted slot leaves exactly two anonymous instances", mesh.count, 2);
  const radians: number = 3 * Math.PI / 180;
  const cosine: number = Math.cos(radians);
  const sine: number = Math.sin(radians);
  for (const [index, slot, lateral] of [[0, 0, -2], [1, 2, 2]] as const) {
    const regenerated: IAutoMovieFormationSlot = regenerateFormationSlot(formation, slot);
    TestValidator.predicate("the engine-owned lattice rotates around its authored anchor", vclose(regenerated.position, {
      x: 10 + lateral * cosine, y: 0, z: -3 - lateral * sine,
    }));
    const matrix: ThreeTypes.Matrix4 = new THREE.Matrix4();
    mesh.getMatrixAt(index, matrix);
    TestValidator.predicate("initial instance coordinates are anchor-relative", nclose(matrix.elements[12]!, lateral * cosine) && nclose(matrix.elements[14]!, -lateral * sine));
  }
  const camera: ThreeTypes.PerspectiveCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(12, 8, 10); camera.lookAt(12, 0, -3);
  runtime.update(camera, 900, 0.25);
  TestValidator.predicate("the root carries cue translation and its quarter turn", vclose(runtime.object.position, { x: 12, y: 0, z: -3 }) && qclose(runtime.object.quaternion, { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }));
  for (const [index, lateral] of [[0, -4], [1, 4]] as const) {
    const matrix: ThreeTypes.Matrix4 = new THREE.Matrix4();
    mesh.getMatrixAt(index, matrix);
    TestValidator.predicate("spacing changes the unit-local lattice before root motion", nclose(matrix.elements[12]!, lateral * cosine) && nclose(matrix.elements[14]!, -lateral * sine));
  }
  TestValidator.predicate("the promoted source keeps its authored displacement and scale", vclose(hero.position, { x: 13, y: 2, z: 0 }) && vclose(hero.scale, { x: 2, y: 3, z: 4 }) && qclose(hero.quaternion, { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }));
  hero.position.set(99, 99, 99);
  hero.scale.set(99, 99, 99);
  runtime.update(camera, 900, 0.25);
  TestValidator.predicate("a second update reads the copied source rather than its previous output", vclose(hero.position, { x: 13, y: 2, z: 0 }) && vclose(hero.scale, { x: 2, y: 3, z: 4 }));
  const source: IAutoMovieTransform = {
    translation: { x: 14, y: 5, z: 3 },
    rotation: { x: 0, y: 1, z: 0, w: 0 },
    scale: { x: 7, y: 8, z: 9 },
  };
  runtime.update(camera, 900, 0.25, new Map([["promoted", source]]));
  TestValidator.predicate("an explicit source snapshot supersedes the initial snapshot", vclose(hero.position, { x: 16, y: 5, z: 3 }) && vclose(hero.scale, source.scale) && qclose(hero.quaternion, { x: 0, y: Math.SQRT1_2, z: 0, w: -Math.SQRT1_2 }));
  runtime.dispose();
  TestValidator.predicate("release retains only the host-owned promoted node", hero.parent === host && host.children.length === 1);
}
