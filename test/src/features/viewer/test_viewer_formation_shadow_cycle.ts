import type {
  AutoMovieBuiltinTexturePurpose,
  IAutoMovieRenderTextureSource,
} from "@automovie/engine";
import {
  type IAutoMovieFormationCycle,
  type IAutoMovieFormationCycleTake,
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
 * A constructed formation binds depth and distance materials to the same mutable cycle cells as beauty and retires its owned resources once.
 *
 * Scenarios:
 * 1. Two chunks share one tier's depth/distance materials and cycle cells; palette groups preserve their geometry groups.
 * 2. Seeks, gait changes, member phases and periodic wrap reuse the tables and uniform cells.
 * 3. Invoking the real shadow-group hook requests program selection after group features are supplied; this observes orchestration rather than a submitted shadow draw.
 * 4. Disposal attempts chunk geometry, both shadow materials, beauty and gait textures once; updating a retired runtime refuses.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the existing multi-chunk formation, reads visible/depth/distance cycle cells, invokes its actual compile/shadow hooks and observes owned disposal events; catches split cycle authority, missing shader patch fields and updates admitted after retirement.
 * @evidence contracts/testing.md#independent-expectations The authored sinusoidal bob and one-second wrap define sampled values; shared uniform identity, literal geometry groups and per-resource event counts pin projection. Native shader templates exercise generated output only, without GLSL compilation or shadow pixels.
 * @evidence contracts/testing.md#distinguishing-cases Covers two chunks, bob-to-gait-to-bob transitions, repeated wrapped time, named versus unbound shadow cycle state, palette program structure and disposal/update refusal; frustum/LOD turning is owned by the adjacent test.
 * @evidence contracts/testing.md#execution-ownership This named portable asynchronous entry uses the existing generic formation inputs and real CPU-side Three resources/hooks, retires its returned owner and starts no GPU renderer, browser, process or new Human test driver.
 */
export async function test_viewer_formation_shadow_cycle(): Promise<void> {
  const THREE: typeof ThreeTypes = await import("three");
  const input: ReturnType<typeof createFormationShadowInputs> =
    createFormationShadowInputs(1025);
  const runtime: ReturnType<typeof buildInstancedFormation> =
    buildInstancedFormation(input);
  const meshes: ThreeTypes.InstancedMesh<
    ThreeTypes.BufferGeometry<
      ThreeTypes.NormalBufferAttributes,
      ThreeTypes.BufferGeometryEventMap
    >,
    | ThreeTypes.Material<ThreeTypes.MaterialEventMap>
    | ThreeTypes.Material<ThreeTypes.MaterialEventMap>[],
    ThreeTypes.Object3DEventMap
  >[] = runtime.object.children as ThreeTypes.InstancedMesh[];
  TestValidator.equals(
    "two chunk batches were actually constructed",
    meshes.length,
    2,
  );
  const mesh: ThreeTypes.InstancedMesh<
    ThreeTypes.BufferGeometry<
      ThreeTypes.NormalBufferAttributes,
      ThreeTypes.BufferGeometryEventMap
    >,
    | ThreeTypes.Material<ThreeTypes.MaterialEventMap>
    | ThreeTypes.Material<ThreeTypes.MaterialEventMap>[],
    ThreeTypes.Object3DEventMap
  > = meshes[0]!;
  const beauty: ThreeTypes.Material<ThreeTypes.MaterialEventMap>[] =
    mesh.material as ThreeTypes.Material[];
  const cycle: IAutoMovieFormationCycle = formationCycleOf(mesh)!;
  const depth: ThreeTypes.Material<ThreeTypes.MaterialEventMap> =
    mesh.customDepthMaterial!;
  const distance: ThreeTypes.Material<ThreeTypes.MaterialEventMap> =
    mesh.customDistanceMaterial!;
  const tableFacts: readonly {
    owner: string;
    texture: Omit<IAutoMovieRenderTextureSource, "asset">;
    purpose?: AutoMovieBuiltinTexturePurpose;
    residents?: readonly string[];
  }[] = runtime.describeTextureSources();
  TestValidator.equals(
    "all declared takes contribute actual float-table facts",
    tableFacts.map(
      ({
        texture,
      }: {
        owner: string;
        texture: Omit<IAutoMovieRenderTextureSource, "asset">;
        purpose?: AutoMovieBuiltinTexturePurpose;
        residents?: readonly string[];
      }): (
        | number
        | boolean
        | "srgb"
        | "linear"
        | "r16f"
        | "rgba8"
        | "rg16f"
        | "rgba16f"
        | "rgba32f"
        | "linear-environment"
        | undefined
      )[] => [
        texture.width,
        texture.height,
        texture.format,
        texture.mipmapped,
        texture.colorSpace,
      ],
    ),
    [
      [32, 9, "rgba32f", false, "linear"],
      [32, 9, "rgba32f", false, "linear"],
    ],
  );
  TestValidator.predicate(
    "distinct take sources have distinct host identities",
    tableFacts[0]!.texture.sourceIdentity !==
      tableFacts[1]!.texture.sourceIdentity,
  );
  TestValidator.predicate(
    "both projections belong to the shared tier",
    depth instanceof THREE.MeshDepthMaterial &&
      distance instanceof THREE.MeshDistanceMaterial &&
      meshes[1]!.customDepthMaterial === depth &&
      meshes[1]!.customDistanceMaterial === distance,
  );
  TestValidator.equals(
    "source material groups survive flattening",
    mesh.geometry.groups.length,
    3,
  );
  TestValidator.predicate(
    "shader-deformed instances bypass rest-geometry frustum tests",
    meshes.every(
      (
        batch: ThreeTypes.InstancedMesh<
          ThreeTypes.BufferGeometry<
            ThreeTypes.NormalBufferAttributes,
            ThreeTypes.BufferGeometryEventMap
          >,
          | ThreeTypes.Material<ThreeTypes.MaterialEventMap>
          | ThreeTypes.Material<ThreeTypes.MaterialEventMap>[],
          ThreeTypes.Object3DEventMap
        >,
      ): boolean => !batch.frustumCulled,
    ),
  );
  const shaders: { uniforms: Record<string, { value: unknown }> }[] = (
    [
      [beauty[0]!, THREE.ShaderLib.standard],
      [depth, THREE.ShaderLib.depth],
      [distance, THREE.ShaderLib.distance],
    ] as const
  ).map(
    ([material, template]: readonly [
      ThreeTypes.Material<ThreeTypes.MaterialEventMap>,
      ThreeTypes.ShaderLibShader,
    ]): { uniforms: Record<string, { value: unknown }> } => {
      const shader: {
        uniforms: {};
        vertexShader: string;
        fragmentShader: string;
      } = {
        uniforms: {},
        vertexShader: template.vertexShader,
        fragmentShader: template.fragmentShader,
      };
      // No renderer operation occurs at this pure shader extension boundary.
      Reflect.apply(material.onBeforeCompile, material, [shader, undefined]);
      return shader as { uniforms: Record<string, { value: unknown }> };
    },
  );
  for (const shader of shaders)
    TestValidator.predicate(
      "each projection reads the exact shared advance and table cells",
      shader.uniforms.automovieCycleAdvance ===
        cycle.uniforms.automovieCycleAdvance &&
        shader.uniforms.automovieCycleTexture ===
          cycle.uniforms.automovieCycleTexture &&
        shader.uniforms.automovieCycleTurn ===
          cycle.uniforms.automovieCycleTurn,
    );
  const camera: ThreeTypes.PerspectiveCamera = new THREE.PerspectiveCamera(
    45,
    1,
    0.1,
    100,
  );
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 1, 0);
  runtime.update(camera, 900, 0.25);
  TestValidator.predicate(
    "time drives the zero-stride gait",
    nclose(cycle.uniforms.automovieCycleAdvance.value, 0.25),
  );
  const first: number = sampleFormationCycleMatrix(cycle, 0, 0.25)
    .elements[13]!;
  TestValidator.predicate(
    "independent authored sine reaches upper quarter-cycle",
    nclose(first, 2),
  );
  TestValidator.predicate(
    "periodic wrap returns the same matrix",
    nclose(sampleFormationCycleMatrix(cycle, 0, 1.25).elements[13]!, first),
  );
  runtime.update(camera, 900, 1.5);
  TestValidator.equals(
    "gait switches retain all declared table owners",
    runtime
      .describeTextureSources()
      .map(
        (fact: {
          owner: string;
          texture: Omit<IAutoMovieRenderTextureSource, "asset">;
          purpose?: AutoMovieBuiltinTexturePurpose;
          residents?: readonly string[];
        }): string => fact.owner,
      ),
    tableFacts.map(
      (fact: {
        owner: string;
        texture: Omit<IAutoMovieRenderTextureSource, "asset">;
        purpose?: AutoMovieBuiltinTexturePurpose;
        residents?: readonly string[];
      }): string => fact.owner,
    ),
  );
  TestValidator.equals(
    "a direct seek selects the second declared gait",
    cycle.active.gait,
    "high",
  );
  runtime.update(camera, 900, 0.25);
  TestValidator.equals(
    "reverse seek restores the original take",
    cycle.active.gait,
    "bob",
  );
  for (const material of [depth, distance]) {
    const before: number = material.version;
    Reflect.apply(mesh.onBeforeShadow, mesh, [
      undefined,
      mesh,
      camera,
      camera,
      mesh.geometry,
      material,
      mesh.geometry.groups[0],
    ]);
    TestValidator.equals(
      "a shadow draw refreshes its grouped program selection",
      material.version,
      before + 1,
    );
    const firstKey: string = material.customProgramCacheKey();
    Reflect.apply(mesh.onBeforeShadow, mesh, [
      undefined,
      mesh,
      camera,
      camera,
      mesh.geometry,
      material,
      mesh.geometry.groups[1],
    ]);
    TestValidator.equals(
      "repeated palette references reuse their shadow program identity",
      material.customProgramCacheKey(),
      firstKey,
    );
    Reflect.apply(mesh.onBeforeShadow, mesh, [
      undefined,
      mesh,
      camera,
      camera,
      mesh.geometry,
      material,
      mesh.geometry.groups[2],
    ]);
    TestValidator.predicate(
      "different palette groups isolate shadow uniforms even with identical shader features",
      material.customProgramCacheKey() !== firstKey,
    );
    Reflect.apply(mesh.onBeforeShadow, mesh, [
      undefined,
      mesh,
      camera,
      camera,
      mesh.geometry,
      material,
      null,
    ]);
    TestValidator.equals(
      "the ungrouped structural projection returns to the first palette",
      material.customProgramCacheKey(),
      firstKey,
    );
  }
  const detached: ThreeTypes.MeshDepthMaterial = new THREE.MeshDepthMaterial();
  const plain: { uniforms: {}; vertexShader: string; fragmentShader: string } =
    {
      uniforms: {},
      vertexShader: THREE.ShaderLib.depth.vertexShader,
      fragmentShader: THREE.ShaderLib.depth.fragmentShader,
    };
  Reflect.apply(detached.onBeforeCompile, detached, [plain, undefined]);
  TestValidator.equals(
    "the unbound negative twin has no cycle cells",
    Object.keys(plain.uniforms).length,
    0,
  );
  applyFormationCycleMaterial(detached, cycle);
  Reflect.apply(detached.onBeforeCompile, detached, [plain, undefined]);
  TestValidator.predicate(
    "binding the adjacent twin provides the same cells",
    Object.keys(plain.uniforms).length > 0,
  );
  detached.dispose();
  const resources: (
    | ThreeTypes.BufferGeometry
    | ThreeTypes.Material
    | ThreeTypes.Texture
    | ThreeTypes.InstancedMesh
  )[] = [
    ...meshes,
    ...meshes.map(
      (
        batch: ThreeTypes.InstancedMesh<
          ThreeTypes.BufferGeometry<
            ThreeTypes.NormalBufferAttributes,
            ThreeTypes.BufferGeometryEventMap
          >,
          | ThreeTypes.Material<ThreeTypes.MaterialEventMap>
          | ThreeTypes.Material<ThreeTypes.MaterialEventMap>[],
          ThreeTypes.Object3DEventMap
        >,
      ): ThreeTypes.BufferGeometry<
        ThreeTypes.NormalBufferAttributes,
        ThreeTypes.BufferGeometryEventMap
      > => batch.geometry,
    ),
    depth,
    distance,
    ...new Set(beauty),
    ...[...cycle.takes.values()].map(
      (take: IAutoMovieFormationCycleTake): ThreeTypes.DataTexture =>
        take.texture,
    ),
  ];
  const counts: { value: number }[] = resources.map(
    (
      resource:
        | ThreeTypes.BufferGeometry
        | ThreeTypes.Material
        | ThreeTypes.Texture
        | ThreeTypes.InstancedMesh,
    ): { value: number } => {
      const count: { value: number } = { value: 0 };
      Reflect.apply(resource.addEventListener, resource, [
        "dispose",
        (): number => ++count.value,
      ]);
      return count;
    },
  );
  const parent: ThreeTypes.Group<ThreeTypes.Object3DEventMap> =
    new THREE.Group();
  parent.add(runtime.object);
  runtime.dispose();
  runtime.dispose();
  TestValidator.equals(
    "released tables leave the context closure",
    runtime.describeTextureSources(),
    [],
  );
  TestValidator.predicate(
    "all observable owned resources retire exactly once",
    counts.every((count: { value: number }): boolean => count.value === 1),
  );
  TestValidator.equals(
    "the retired root leaves its parent and chunks",
    [parent.children.length, runtime.object.children.length],
    [0, 0],
  );
  TestValidator.predicate(
    "a disposed runtime rejects an update",
    throwsError((): void => runtime.update(camera, 900, 0), "disposed"),
  );
}
