import { buildInstancedFormation } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as ThreeTypes from "three";

import { createFormationShadowInputs } from "../internal/createFormationShadowInputs";
import { throwsError } from "../internal/predicates";

/**
 * A static, empty or promoted-only formation does not fabricate a cycle; invalid
 * runtime identities and unavailable declared gaits refuse before chunk draws.
 *
 * Scenarios:
 * 1. A noncyclic tier uses Three's normal shadows and remains disposable.
 * 2. Empty and hero-only populations create no anonymous meshes, and dispose
 *    leaves the host's promoted object and material untouched.
 * 3. Missing first/late LOD models and an unavailable gait refuse, while a
 *    foreign formation cue or an omitted gait does not trigger that refusal.
 */
export const test_viewer_formation_shadow_boundaries = async (): Promise<void> => {
  const THREE = await import("three");
  const plain = buildInstancedFormation(createFormationShadowInputs(1, false));
  const mesh = plain.object.children[0] as ThreeTypes.InstancedMesh;
  TestValidator.equals("static tiers have no runtime table residency", plain.describeTextureSources(), []);
  TestValidator.equals("static tiers do not allocate shadow overrides", [mesh.customDepthMaterial, mesh.customDistanceMaterial], [undefined, undefined]);
  plain.dispose(); plain.dispose();
  const empty = buildInstancedFormation(createFormationShadowInputs(0));
  TestValidator.equals("empty populations allocate no anonymous meshes", empty.object.children.length, 0);
  TestValidator.equals("CPU-only empty-population tables have no reachable GPU storage", empty.describeTextureSources(), []);
  empty.dispose();
  const noTiersInput = createFormationShadowInputs(0);
  noTiersInput.formation.lod = [];
  const noTiers = buildInstancedFormation(noTiersInput);
  TestValidator.equals("an empty population can release an empty tier set", noTiers.object.children.length, 0);
  noTiers.dispose();
  const promoted = createFormationShadowInputs(1);
  promoted.formation.heroes = [{ slot: 0, actor: "promoted", transform: {
    translation: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 },
  } }];
  const hero = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  promoted.heroObjects = new Map([["promoted", hero]]);
  let heroDisposals = 0;
  hero.geometry.addEventListener("dispose", () => ++heroDisposals);
  hero.material.addEventListener("dispose", () => ++heroDisposals);
  const heroes = buildInstancedFormation(promoted);
  TestValidator.equals("hero slots have no anonymous draw", heroes.object.children.length, 0);
  TestValidator.equals("CPU-only hero-substitution tables have no reachable GPU storage", heroes.describeTextureSources(), []);
  heroes.dispose(); TestValidator.equals("host-owned hero resources survive", heroDisposals, 0);
  hero.geometry.dispose(); hero.material.dispose();
  const invalid = createFormationShadowInputs();
  TestValidator.predicate("a missing runtime identity refuses", throwsError(() => buildInstancedFormation({ ...invalid, models: new Map() }), "missing runtime model"));
  const later = { ...invalid.formation.lod[0]!, tier: "far" as const, model: "absent", maxDistance: null };
  TestValidator.predicate("a late missing tier refuses after an earlier valid tier", throwsError(() => buildInstancedFormation({ ...invalid, formation: { ...invalid.formation, lod: [...invalid.formation.lod, later] } }), "missing runtime model"));
  const badCue = { ...invalid.motions![0]!, gait: "absent" };
  TestValidator.predicate("an unavailable declared gait refuses", throwsError(() => buildInstancedFormation({ ...invalid, motions: [badCue] }), "calls for gait"));
  const unrelated = buildInstancedFormation({ ...invalid, motions: [{ ...badCue, formation: "other" }] });
  unrelated.dispose();
  const { gait: _gait, ...omitted } = badCue;
  const fallback = buildInstancedFormation({ ...invalid, motions: [omitted] });
  fallback.dispose();
  const noCues = buildInstancedFormation({ ...invalid, motions: undefined });
  noCues.dispose();
};
