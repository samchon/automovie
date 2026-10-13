import { materializeCompiledFormation } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";
import { buildInstancedFormation, regenerateFormationSlot } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as ThreeTypes from "three";

import { createFormationShadowInputs } from "../internal/createFormationShadowInputs";
import { nclose, qclose, vclose } from "../internal/predicates";

/**
 * Formation placement delegates its arithmetic to the engine while keeping
 * instance coordinates local and promoted source transforms copied before use.
 * The authored three-degree line supplies an independent rotated-lattice oracle.
 *
 * Scenarios:
 * 1. Default construction regenerates the original rotated slots and writes
 *    their anchor-relative coordinates without spacing or motion displacement.
 * 2. A doubled lateral spacing uses the designed heading before a quarter turn;
 *    the root carries the cue's translation and rotation exactly once.
 * 3. A promoted source's displacement, rotation and scale survive two updates
 *    without reading back the transform the runtime itself wrote.
 * 4. An explicit source snapshot supersedes the initial snapshot, and release
 *    retains the host's promoted object while detaching anonymous resources.
 */
export const test_viewer_formation_placement_source = async (): Promise<void> => {
  const THREE = await import("three");
  const input = createFormationShadowInputs(3, false);
  const model = [...input.models.values()][0]!;
  const formation = materializeCompiledFormation({
    formation: {
      id: "placement-unit", modelRecipe: "box", count: 3,
      layout: { kind: "line", files: 3, ranks: 1, spacing: { lateral: 2, depth: 1 } },
      anchor: { x: 10, y: 0, z: -3 }, facingDeg: 3, seed: 7,
      capabilities: [], heroOverrides: [{ slot: 1, actor: "promoted" }],
    },
    projectionRadii: new Map([["box", 3]]),
  });
  const state = {
    translation: { x: 2, y: 0, z: 0 }, facingOffsetDeg: 90,
    spacingScale: { lateral: 2, depth: 3 },
  };
  input.formation = formation;
  input.models = new Map([[formation.lod[0]!.model, model]]);
  input.motions = [{
    id: "placement-cue", formation: formation.id, action: "hold", start: 0,
    end: 1, from: state, to: state, easing: "linear",
  }];
  const hero = new THREE.Group();
  hero.position.set(11, 2, 0);
  hero.scale.set(2, 3, 4);
  const host = new THREE.Scene();
  host.add(hero);
  input.heroObjects = new Map([["promoted", hero]]);
  const runtime = buildInstancedFormation(input);
  host.add(runtime.object);
  const mesh = runtime.object.children[0] as ThreeTypes.InstancedMesh;
  TestValidator.equals("the promoted slot leaves exactly two anonymous instances", mesh.count, 2);
  const radians = 3 * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  for (const [index, slot, lateral] of [[0, 0, -2], [1, 2, 2]] as const) {
    const regenerated = regenerateFormationSlot(formation, slot);
    TestValidator.predicate("the engine-owned lattice rotates around its authored anchor", vclose(regenerated.position, {
      x: 10 + lateral * cosine, y: 0, z: -3 - lateral * sine,
    }));
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(index, matrix);
    TestValidator.predicate("initial instance coordinates are anchor-relative", nclose(matrix.elements[12]!, lateral * cosine) && nclose(matrix.elements[14]!, -lateral * sine));
  }
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(12, 8, 10); camera.lookAt(12, 0, -3);
  runtime.update(camera, 900, 0.25);
  TestValidator.predicate("the root carries cue translation and its quarter turn", vclose(runtime.object.position, { x: 12, y: 0, z: -3 }) && qclose(runtime.object.quaternion, { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }));
  for (const [index, lateral] of [[0, -4], [1, 4]] as const) {
    const matrix = new THREE.Matrix4();
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
};
