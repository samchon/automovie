import type {
  IAutoMovieCompiledFormationLod,
  IAutoMovieFormationMotion,
} from "@automovie/interface";
import { buildInstancedFormation, formationCycleOf } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFormationShadowInputs } from "../internal/createFormationShadowInputs";
import { throwsError } from "../internal/predicates";

/**
 * Static, empty and promoted-only formations avoid fabricated cycle resources; invalid runtime identities and unavailable declared gaits refuse before any draw is requested by this unit.
 *
 * Scenarios:
 * 1. A noncyclic tier uses Three's normal shadows and remains disposable.
 * 2. Empty and hero-only populations create no anonymous meshes, and dispose leaves the host's promoted object and material untouched.
 * 3. Missing first/late LOD models and an unavailable gait refuse, while a foreign formation cue or an omitted gait does not trigger that refusal.
 * 4. A failing chunk-geometry and shadow-depth listener cannot skip instance, shadow-distance, palette-material or gait-texture retirement; repeated disposal preserves one completion failure without repeating attempts.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds real static, cyclic, empty and promoted-only formations and observes their public meshes, texture facts and dispose events; catches fabricated cyclic storage, invalid identity/gait acceptance and cleanup that stops after one throwing listener.
 * @evidence contracts/testing.md#independent-expectations Authored fixture population, two declared palette materials and two gait takes determine counts; real Three dispose events count attempts independently of runtime statistics, and original injected Error references must remain present in the repeated aggregate completion.
 * @evidence contracts/testing.md#distinguishing-cases Covers noncyclic and cyclic tiers, zero population, no tiers, hero-only ownership, missing first/late models, absent/foreign/unknown gaits and successful/rejected repeated disposal; separate formation tests own motion and shadow appearance parity.
 * @evidence contracts/testing.md#execution-ownership This discovered unit function constructs in-memory Three geometry, materials and textures without a renderer or GPU and registers all event cases locally; fixture helpers only assemble portable compiled inputs.
 */
export function test_viewer_formation_shadow_boundaries(): void {
  const plain: ReturnType<typeof buildInstancedFormation> =
    buildInstancedFormation(createFormationShadowInputs(1, false));
  const mesh: THREE.InstancedMesh = plain.object
    .children[0] as THREE.InstancedMesh;
  TestValidator.equals(
    "static tiers have no runtime table residency",
    plain.describeTextureSources(),
    [],
  );
  TestValidator.equals(
    "static tiers do not allocate shadow overrides",
    [mesh.customDepthMaterial, mesh.customDistanceMaterial],
    [undefined, undefined],
  );
  plain.dispose();
  plain.dispose();
  const empty: ReturnType<typeof buildInstancedFormation> =
    buildInstancedFormation(createFormationShadowInputs(0));
  TestValidator.equals(
    "empty populations allocate no anonymous meshes",
    empty.object.children.length,
    0,
  );
  TestValidator.equals(
    "CPU-only empty-population tables have no reachable GPU storage",
    empty.describeTextureSources(),
    [],
  );
  empty.dispose();
  const noTiersInput: ReturnType<typeof createFormationShadowInputs> =
    createFormationShadowInputs(0);
  noTiersInput.formation.lod = [];
  const noTiers: ReturnType<typeof buildInstancedFormation> =
    buildInstancedFormation(noTiersInput);
  TestValidator.equals(
    "an empty population can release an empty tier set",
    noTiers.object.children.length,
    0,
  );
  noTiers.dispose();
  const promoted: ReturnType<typeof createFormationShadowInputs> =
    createFormationShadowInputs(1);
  promoted.formation.heroes = [
    {
      slot: 0,
      actor: "promoted",
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
    },
  ];
  const hero: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial> =
    new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  promoted.heroObjects = new Map([["promoted", hero]]);
  let heroDisposals: number = 0;
  hero.geometry.addEventListener("dispose", (): void => {
    ++heroDisposals;
  });
  hero.material.addEventListener("dispose", (): void => {
    ++heroDisposals;
  });
  const heroes: ReturnType<typeof buildInstancedFormation> =
    buildInstancedFormation(promoted);
  TestValidator.equals(
    "hero slots have no anonymous draw",
    heroes.object.children.length,
    0,
  );
  TestValidator.equals(
    "CPU-only hero-substitution tables have no reachable GPU storage",
    heroes.describeTextureSources(),
    [],
  );
  heroes.dispose();
  TestValidator.equals("host-owned hero resources survive", heroDisposals, 0);
  hero.geometry.dispose();
  hero.material.dispose();
  const invalid: ReturnType<typeof createFormationShadowInputs> =
    createFormationShadowInputs();
  TestValidator.predicate(
    "a missing runtime identity refuses",
    throwsError(
      (): ReturnType<typeof buildInstancedFormation> =>
        buildInstancedFormation({ ...invalid, models: new Map() }),
      "missing runtime model",
    ),
  );
  const later: IAutoMovieCompiledFormationLod = {
    ...invalid.formation.lod[0]!,
    tier: "far",
    runtimeModel: "absent",
    maxDistance: null,
  };
  TestValidator.predicate(
    "a late missing tier refuses after an earlier valid tier",
    throwsError(
      (): ReturnType<typeof buildInstancedFormation> =>
        buildInstancedFormation({
          ...invalid,
          formation: {
            ...invalid.formation,
            lod: [...invalid.formation.lod, later],
          },
        }),
      "missing runtime model",
    ),
  );
  const badCue: IAutoMovieFormationMotion = {
    ...invalid.motions![0]!,
    gait: "absent",
  };
  TestValidator.predicate(
    "an unavailable declared gait refuses",
    throwsError(
      (): ReturnType<typeof buildInstancedFormation> =>
        buildInstancedFormation({ ...invalid, motions: [badCue] }),
      "calls for gait",
    ),
  );
  const unrelated: ReturnType<typeof buildInstancedFormation> =
    buildInstancedFormation({
      ...invalid,
      motions: [{ ...badCue, formation: "other" }],
    });
  unrelated.dispose();
  const { gait: _gait, ...omitted }: IAutoMovieFormationMotion = badCue;
  const fallback: ReturnType<typeof buildInstancedFormation> =
    buildInstancedFormation({ ...invalid, motions: [omitted] });
  fallback.dispose();
  const noCues: ReturnType<typeof buildInstancedFormation> =
    buildInstancedFormation({ ...invalid, motions: undefined });
  noCues.dispose();

  const fragile: ReturnType<typeof buildInstancedFormation> =
    buildInstancedFormation(createFormationShadowInputs());
  const fragileMesh: THREE.InstancedMesh = fragile.object
    .children[0] as THREE.InstancedMesh;
  const palette: THREE.Material[] = Array.isArray(fragileMesh.material)
    ? fragileMesh.material
    : [fragileMesh.material];
  const cycle: NonNullable<ReturnType<typeof formationCycleOf>> =
    formationCycleOf(fragileMesh)!;
  const retainedTables: ReturnType<typeof fragile.describeTextureSources> =
    fragile.describeTextureSources();
  TestValidator.equals(
    "both authored gait takes have potential table facts",
    retainedTables.length,
    2,
  );
  const geometryFailure: Error = new Error(
    "Chunk geometry retirement listener refused.",
  );
  const depthFailure: Error = new Error(
    "Depth material retirement listener refused.",
  );
  let geometries: number = 0;
  let instances: number = 0;
  let depths: number = 0;
  let distances: number = 0;
  let materials: number = 0;
  let textures: number = 0;
  fragileMesh.geometry.addEventListener("dispose", (): never => {
    ++geometries;
    throw geometryFailure;
  });
  fragileMesh.addEventListener("dispose", (): void => {
    ++instances;
  });
  fragileMesh.customDepthMaterial!.addEventListener("dispose", (): never => {
    ++depths;
    throw depthFailure;
  });
  fragileMesh.customDistanceMaterial!.addEventListener("dispose", (): void => {
    ++distances;
  });
  for (const one of new Set(palette))
    one.addEventListener("dispose", (): void => {
      ++materials;
    });
  for (const take of cycle.takes.values())
    take.texture.addEventListener("dispose", (): void => {
      ++textures;
    });
  let firstFailure: unknown;
  let repeatedFailure: unknown;
  try {
    fragile.dispose();
  } catch (error) {
    firstFailure = error;
  }
  try {
    fragile.dispose();
  } catch (error) {
    repeatedFailure = error;
  }
  TestValidator.predicate(
    "all original retirement causes survive in one repeated completion",
    firstFailure === repeatedFailure &&
      firstFailure instanceof AggregateError &&
      firstFailure.errors.includes(geometryFailure) &&
      firstFailure.errors.includes(depthFailure),
  );
  TestValidator.equals(
    "independent resources release after geometry and depth listeners fail, without retries",
    [geometries, instances, depths, distances, materials, textures],
    [1, 1, 1, 1, 2, 2],
  );
  TestValidator.equals(
    "failed retirement still detaches the scene root",
    fragile.object.children.length,
    0,
  );
  TestValidator.equals(
    "failed retirement retains its potential table facts",
    fragile.describeTextureSources(),
    retainedTables,
  );
}
