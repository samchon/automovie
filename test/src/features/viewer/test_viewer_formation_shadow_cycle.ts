import {
  applyFormationCycleMaterial,
  buildInstancedFormation,
  formationCycleOf,
  sampleFormationCycleMatrix,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as ThreeTypes from "three";

import { createFormationShadowInputs } from "../internal/createFormationShadowInputs";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A constructed formation binds its actual shadow projections to the same
 * mutable cycle cells as beauty and retires its owned resources once.
 *
 * Scenarios:
 * 1. Two chunks share one tier's depth/distance materials and cycle cells;
 *    multiple palette groups retain their original geometry groups.
 * 2. Direct time seeks, gait changes, member phases and periodic wrap read
 *    the same tables without replacing the uniform cells.
 * 3. Each shadow-group draw requests program selection after Three copied
 *    group features; detaching either custom projection breaks this boundary.
 * 4. Disposal releases chunk geometry, both shadow projections, beauty and
 *    every gait texture exactly once; updating a retired runtime refuses.
 */
export const test_viewer_formation_shadow_cycle = async (): Promise<void> => {
  const THREE = await import("three");
  const input = createFormationShadowInputs(1025);
  const runtime = buildInstancedFormation(input);
  const meshes = runtime.object.children as ThreeTypes.InstancedMesh[];
  TestValidator.equals("two chunk batches were actually constructed", meshes.length, 2);
  const mesh = meshes[0]!;
  const beauty = mesh.material as ThreeTypes.Material[];
  const cycle = formationCycleOf(mesh)!;
  const depth = mesh.customDepthMaterial!;
  const distance = mesh.customDistanceMaterial!;
  const tableFacts = runtime.describeTextureSources();
  TestValidator.equals("all declared takes contribute actual float-table facts", tableFacts.map(({ texture }) => [texture.width, texture.height, texture.format, texture.mipmapped, texture.colorSpace]), [[32, 9, "rgba32f", false, "linear"], [32, 9, "rgba32f", false, "linear"]]);
  TestValidator.predicate("distinct take sources have distinct host identities", tableFacts[0]!.texture.sourceIdentity !== tableFacts[1]!.texture.sourceIdentity);
  TestValidator.predicate("both projections belong to the shared tier", depth instanceof THREE.MeshDepthMaterial && distance instanceof THREE.MeshDistanceMaterial && meshes[1]!.customDepthMaterial === depth && meshes[1]!.customDistanceMaterial === distance);
  TestValidator.equals("source material groups survive flattening", mesh.geometry.groups.length, 3);
  TestValidator.predicate("shader-deformed instances bypass rest-geometry frustum tests", meshes.every((batch) => !batch.frustumCulled));
  const shaders = ([
    [beauty[0]!, THREE.ShaderLib.standard],
    [depth, THREE.ShaderLib.depth],
    [distance, THREE.ShaderLib.distance],
  ] as const).map(([material, template]) => {
    const shader = { uniforms: {}, vertexShader: template.vertexShader,
      fragmentShader: template.fragmentShader };
    // No renderer operation occurs at this pure shader extension boundary.
    Reflect.apply(material.onBeforeCompile, material, [shader, undefined]);
    return shader as { uniforms: Record<string, { value: unknown }> };
  });
  for (const shader of shaders)
    TestValidator.predicate("each projection reads the exact shared advance and table cells", shader.uniforms.automovieCycleAdvance === cycle.uniforms.automovieCycleAdvance && shader.uniforms.automovieCycleTexture === cycle.uniforms.automovieCycleTexture && shader.uniforms.automovieCycleTurn === cycle.uniforms.automovieCycleTurn);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 5, 10); camera.lookAt(0, 1, 0);
  runtime.update(camera, 900, 0.25);
  TestValidator.predicate("time drives the zero-stride gait", nclose(cycle.uniforms.automovieCycleAdvance.value, 0.25));
  const first = sampleFormationCycleMatrix(cycle, 0, 0.25).elements[13]!;
  TestValidator.predicate("independent authored sine reaches upper quarter-cycle", nclose(first, 2));
  TestValidator.predicate("periodic wrap returns the same matrix", nclose(sampleFormationCycleMatrix(cycle, 0, 1.25).elements[13]!, first));
  runtime.update(camera, 900, 1.5);
  TestValidator.equals("gait switches retain all declared table owners", runtime.describeTextureSources().map((fact) => fact.owner), tableFacts.map((fact) => fact.owner));
  TestValidator.equals("a direct seek selects the second declared gait", cycle.active.gait, "high");
  runtime.update(camera, 900, 0.25);
  TestValidator.equals("reverse seek restores the original take", cycle.active.gait, "bob");
  for (const material of [depth, distance]) {
    const before = material.version;
    Reflect.apply(mesh.onBeforeShadow, mesh, [undefined, mesh, camera, camera, mesh.geometry, material, mesh.geometry.groups[0]]);
    TestValidator.equals("a shadow draw refreshes its grouped program selection", material.version, before + 1);
    const firstKey = material.customProgramCacheKey();
    Reflect.apply(mesh.onBeforeShadow, mesh, [undefined, mesh, camera, camera, mesh.geometry, material, mesh.geometry.groups[1]]);
    TestValidator.equals("repeated palette references reuse their shadow program identity", material.customProgramCacheKey(), firstKey);
    Reflect.apply(mesh.onBeforeShadow, mesh, [undefined, mesh, camera, camera, mesh.geometry, material, mesh.geometry.groups[2]]);
    TestValidator.predicate("different palette groups isolate shadow uniforms even with identical shader features", material.customProgramCacheKey() !== firstKey);
    Reflect.apply(mesh.onBeforeShadow, mesh, [undefined, mesh, camera, camera, mesh.geometry, material, null]);
    TestValidator.equals("the ungrouped structural projection returns to the first palette", material.customProgramCacheKey(), firstKey);
  }
  const detached = new THREE.MeshDepthMaterial();
  const plain = { uniforms: {}, vertexShader: THREE.ShaderLib.depth.vertexShader,
    fragmentShader: THREE.ShaderLib.depth.fragmentShader };
  Reflect.apply(detached.onBeforeCompile, detached, [plain, undefined]);
  TestValidator.equals("the unbound negative twin has no cycle cells", Object.keys(plain.uniforms).length, 0);
  applyFormationCycleMaterial(detached, cycle);
  Reflect.apply(detached.onBeforeCompile, detached, [plain, undefined]);
  TestValidator.predicate("binding the adjacent twin provides the same cells", Object.keys(plain.uniforms).length > 0);
  detached.dispose();
  const resources: (ThreeTypes.BufferGeometry | ThreeTypes.Material | ThreeTypes.Texture | ThreeTypes.InstancedMesh)[] = [
    ...meshes, ...meshes.map((batch) => batch.geometry), depth, distance,
    ...new Set(beauty), ...[...cycle.takes.values()].map((take) => take.texture),
  ];
  const counts = resources.map((resource) => {
    const count = { value: 0 };
    Reflect.apply(resource.addEventListener, resource, ["dispose", () => ++count.value]);
    return count;
  });
  const parent = new THREE.Group(); parent.add(runtime.object);
  runtime.dispose(); runtime.dispose();
  TestValidator.equals("released tables leave the context closure", runtime.describeTextureSources(), []);
  TestValidator.equals("all observable owned resources retire exactly once", counts.map((count) => count.value), counts.map(() => 1));
  TestValidator.equals("the retired root leaves its parent and chunks", [parent.children.length, runtime.object.children.length], [0, 0]);
  TestValidator.predicate("a disposed runtime rejects an update", throwsError(() => runtime.update(camera, 900, 0), "disposed"));
};
