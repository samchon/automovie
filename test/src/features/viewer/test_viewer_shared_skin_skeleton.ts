import type {
  AutoMovieHumanoidBone,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import {
  AutoMovieSkinnedMesh,
  type IAutoMovieModelObject,
  type IAutoMovieRigLocalTransform,
  applyAutoMovieRigLocals,
  buildModel,
  collectAutoMovieOwnedResources,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createSkinnedTubeModel } from "../internal/createSkinnedTubeModel";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Skins share ordered joint palettes while retaining their own bind transforms.
 *
 * Scenarios:
 *
 * 1. Three parts with the same ordered joints share one Skeleton across linear
 * and dual-quaternion skins; a reversed palette owns a distinct Skeleton.
 * 2. Every vertex retains authored geometry, part translation/rotation/scale,
 * blend choice and enabled culling at rest and under translated articulated
 * bones and a translated, quarter-turned root.
 * 3. Separate builds keep independent bones and skeletons; disposing the first
 * graph collects each shared palette once and retires both bone textures once.
 * 4. A missing joint in a later palette still refuses construction.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls buildModel on four real skinned tube parts, observes shared/distinct skeleton identities and methods, checks every drawn CPU vertex and world bound before/after public local posing, and retires actual collected resources through public dispose events; catches duplicate GPU palette owners, unordered cache keys, overwritten per-part binds, lost geometry/placement/culling, cross-model pose sharing and duplicate texture retirement.
 * @evidence contracts/development/testing.md#independent-expectations Each fixture vertex is transformed by its literal authored part TRS; pure bone translation adds one metre in x plus the fixture's independently authored spine weight times 0.2 metres. A root y quarter-turn and translation then gives the world reference. Linear and dual-quaternion blending of pure translations have the same weighted translation, and reversing both joint slots and skin indices preserves the authored influence. Resource identity and disposal counts are observed native events rather than implementation snapshots.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers equal-content distinct joint arrays, reversed ordering with remapped indices, both blend methods, identity and nonidentity part TRS with uniform scale, translated child/root, rest/posed bounds, independent builds, resource disposal with allocated CPU bone textures and a missing joint after valid shared skins. Shader rendering remains the real host's verification.
 * @evidence contracts/development/testing.md#execution-ownership One portable CPU unit uses maintained Viewer entries and the shared synthetic tube fixture; computeBoneTexture allocates ordinary typed-array/texture wrappers without a renderer, browser, GPU or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Three parts with the same ordered joints share one Skeleton across linear).
 */
export function test_viewer_shared_skin_skeleton(): void {
  const source: IAutoMovieModel = createSkinnedTubeModel("linear");
  const original: IAutoMovieModelPart = source.parts[0]!;
  if (original.geometry.type !== "mesh") throw new Error("Expected tube mesh");
  const originalMesh: IAutoMovieMesh = original.geometry.mesh;
  const half: number = Math.SQRT1_2;
  source.parts = Array.from(
    { length: 4 },
    (_: unknown, i: number): IAutoMovieModelPart => ({
      ...original,
      id: `skin-${i}`,
      name: `skin-${i}`,
      transform:
        i === 0
          ? null
          : {
              translation: { x: i * 0.3, y: i * -0.2, z: i * 0.1 },
              rotation: { x: 0, y: 0, z: half, w: half },
              scale: { x: 1.5, y: 1.5, z: 1.5 },
            },
      geometry: {
        type: "mesh",
        mesh: {
          ...originalMesh,
          skin: {
            ...originalMesh.skin!,
            method: i === 2 ? "dual-quaternion" : "linear",
            joints: i === 3 ? ["spine", "hips"] : ["hips", "spine"],
            boneIndices: originalMesh.skin!.boneIndices.map(
              (slot: number): number => (i === 3 ? 1 - slot : slot),
            ),
          },
        },
      },
    }),
  );
  const built: IAutoMovieModelObject = buildModel(source);
  const independent: IAutoMovieModelObject = buildModel(source);
  const skins: THREE.SkinnedMesh[] = source.parts.map(
    (part: IAutoMovieModelPart): THREE.SkinnedMesh =>
      built.parts.get(part.id) as THREE.SkinnedMesh,
  );
  const defects: string[] = [];
  const check: (label: string, passed: boolean) => void = (
    label: string,
    passed: boolean,
  ): void => {
    if (!passed) defects.push(label);
  };
  check(
    "equal ordered palettes share across methods",
    skins[0]!.skeleton === skins[1]!.skeleton &&
      skins[0]!.skeleton === skins[2]!.skeleton,
  );
  check(
    "reversed palette retains ordering",
    skins[3]!.skeleton !== skins[0]!.skeleton &&
      skins[3]!.skeleton.bones[0] === built.bones.get("spine") &&
      skins[3]!.skeleton.bones[1] === built.bones.get("hips"),
  );
  check(
    "independent build owns its graph",
    (independent.parts.get("skin-0") as THREE.SkinnedMesh).skeleton !==
      skins[0]!.skeleton &&
      independent.bones.get("spine") !== built.bones.get("spine"),
  );
  check(
    "material variants and culling retained",
    skins[0]!.material === skins[1]!.material &&
      skins[0]!.material !== skins[2]!.material &&
      skins.every((skin: THREE.SkinnedMesh): boolean => skin.frustumCulled),
  );
  check(
    "blend methods retained",
    skins.every(
      (skin: THREE.SkinnedMesh, index: number): boolean =>
        skin instanceof AutoMovieSkinnedMesh &&
        skin.method === (index === 2 ? "dual-quaternion" : "linear"),
    ),
  );
  check(
    "bind matrices stay per mesh",
    !skins[0]!.bindMatrix.equals(skins[1]!.bindMatrix),
  );
  const identity: IAutoMovieRigLocalTransform = {
    translation: [0, 0, 0],
    rotation: [0, 0, 0, 1],
  };
  const rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieRigLocalTransform> =
    new Map<AutoMovieHumanoidBone, IAutoMovieRigLocalTransform>([
      ["hips", identity],
      ["spine", { ...identity, translation: [0, 1, 0] }],
    ]);
  const posed: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieRigLocalTransform> =
    new Map<AutoMovieHumanoidBone, IAutoMovieRigLocalTransform>([
      ["hips", { ...identity, translation: [1, 0, 0] }],
      ["spine", { ...identity, translation: [0.2, 1, 0] }],
    ]);
  const placement: IAutoMovieRigLocalTransform = {
    translation: [4, 2, -3],
    rotation: [0, half, 0, half],
  };
  for (const active of [false, true]) {
    applyAutoMovieRigLocals(
      built,
      active ? posed : rest,
      active ? placement : identity,
    );
    for (let index: number = 0; index < skins.length; ++index) {
      const skin: THREE.SkinnedMesh = skins[index]!;
      const part: IAutoMovieModelPart = source.parts[index]!;
      const bounds: THREE.Box3 = new THREE.Box3().setFromObject(skin);
      let matches: boolean = true;
      let contained: boolean = true;
      const count: number = originalMesh.positions.length / 3;
      for (let vertex: number = 0; vertex < count; ++vertex) {
        const expected: THREE.Vector3 = new THREE.Vector3().fromArray(
          originalMesh.positions,
          3 * vertex,
        );
        if (part.transform !== null) {
          const t: IAutoMovieModelPart["transform"] = part.transform;
          expected.multiply(new THREE.Vector3(t.scale.x, t.scale.y, t.scale.z));
          expected.applyQuaternion(
            new THREE.Quaternion(
              t.rotation.x,
              t.rotation.y,
              t.rotation.z,
              t.rotation.w,
            ),
          );
          expected.add(
            new THREE.Vector3(
              t.translation.x,
              t.translation.y,
              t.translation.z,
            ),
          );
        }
        if (active) {
          expected.x += 1 + originalMesh.skin!.weights[4 * vertex + 1]! * 0.2;
          expected.applyQuaternion(new THREE.Quaternion(0, half, 0, half));
          expected.add(new THREE.Vector3(4, 2, -3));
        }
        const actual: THREE.Vector3 = skin
          .getVertexPosition(vertex, new THREE.Vector3())
          .applyMatrix4(skin.matrixWorld);
        matches &&=
          nclose(actual.x, expected.x, 2e-6) &&
          nclose(actual.y, expected.y, 2e-6) &&
          nclose(actual.z, expected.z, 2e-6);
        contained &&= bounds.containsPoint(actual);
      }
      check(`${active ? "posed" : "rest"} part ${index} vertices`, matches);
      check(`${active ? "posed" : "rest"} part ${index} bounds`, contained);
      check(
        `part ${index} geometry population`,
        skin.geometry.getAttribute("position").count === count &&
          skin.geometry.index!.count === originalMesh.indices!.length &&
          [...skin.geometry.index!.array].every(
            (value: number, i: number): boolean =>
              value === originalMesh.indices![i],
          ),
      );
    }
  }
  check(
    "other build remains unposed",
    nclose(independent.bones.get("hips")!.position.x, 0, 0),
  );

  // Native texture events prove distinct palettes are retired once even when
  // three meshes share the first one; no renderer or method replacement is used.
  const palettes: Set<THREE.Skeleton> = new Set(
    skins.map((skin: THREE.SkinnedMesh): THREE.Skeleton => skin.skeleton),
  );
  let retired: number = 0;
  for (const skeleton of palettes) {
    skeleton.computeBoneTexture();
    skeleton.boneTexture!.addEventListener("dispose", (): void => {
      retired++;
    });
  }
  const resources: readonly { dispose(): void }[] =
    collectAutoMovieOwnedResources(built.object);
  check(
    "collector keeps unique palette owners",
    resources.filter((resource: { dispose(): void }): boolean =>
      palettes.has(resource as THREE.Skeleton),
    ).length === 2,
  );
  for (const resource of resources) resource.dispose();
  check(
    "shared palette textures retire once",
    retired === 2 &&
      [...palettes].every(
        (skeleton: THREE.Skeleton): boolean => skeleton.boneTexture === null,
      ),
  );
  for (const resource of collectAutoMovieOwnedResources(independent.object))
    resource.dispose();

  const badPart: IAutoMovieModelPart = source.parts[3]!;
  if (badPart.geometry.type !== "mesh") throw new Error("Expected mesh skin");
  badPart.geometry.mesh.skin!.joints = ["head"];
  check(
    "later missing palette joint refuses",
    throwsError((): void => {
      buildModel(source);
    }, ["skin-3", "head"]),
  );
  TestValidator.equals("shared palette semantics and retirement", defects, []);
}
