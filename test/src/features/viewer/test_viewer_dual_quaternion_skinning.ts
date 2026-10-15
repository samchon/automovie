import type { IAutoMovieModel } from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  type IAutoMovieRenderModeHandle,
  applyAutoMovieSemanticMask,
  applyRenderMode,
  buildModel,
  dualQuaternionSkinningVertex,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createSkinnedTubeModel } from "../internal/createSkinnedTubeModel";
import { throwsError } from "../internal/predicates";

/**
 * A dual-quaternion skin builds a material variant and shadow materials carrying the dual quaternion vertex patch, while a linear or unspecified skin keeps Three's linear blend. The unit observes built objects, program keys and generated vertex source, not GPU pixels.
 *
 * Scenarios:
 * 1. A dual-quaternion tube is a SkinnedMesh whose material, depth material and distance material all carry the patch key.
 * 2. A linear tube and a tube with no method carry no patch and no custom shadow materials.
 * 3. A dual-quaternion part and a linear part sharing one material definition receive different material variants.
 * 4. The registered compile hook rewrites the physical vertex shader: the blend follows `skinbase_vertex`, normals and positions read it, and Three's linear chunks are gone.
 * 5. The depth vertex shader, which has no skinning normal chunk, is still rewritten; a shader without skinning chunks throws.
 * 6. Every guide pass that swaps materials (depth, normal, outline fill and shell, mask, semantic mask) patches the dual-quaternion tube's replacement and not the linear tube's, and restoring returns the original material.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds models through buildModel, invokes the material's own onBeforeCompile on Three's shader sources and reads keys and source text; catches a patch on the wrong variant, missing shadow materials, a guide pass drawing the skin linearly, a linear chunk left in place, a blend placed after its readers and a silent pass-through of an unsupported shader.
 * @evidence contracts/testing.md#independent-expectations Expectations follow the interface contract (only "dual-quaternion" changes the blend, omission means linear) and Three's chunk order for skinning, not the patch's own output; the GLSL is not compiled here, so its arithmetic is verified on a hardware renderer instead.
 * @evidence contracts/testing.md#distinguishing-cases Dual-quaternion, linear and omitted methods; a shared definition split by method; physical and depth shaders; an unsupported shader; and each material-swapping guide pass over a dual-quaternion and a linear tube side by side. Mesh admission and skinning arithmetic belong to the validation and kinematics tests.
 * @evidence contracts/testing.md#execution-ownership A portable unit over CPU-side Three objects and shader strings with a synthetic internal fixture; it starts no browser, GPU or process.
 */
export function test_viewer_dual_quaternion_skinning(): void {
  const KEY: string = "automovie-dual-quaternion-skinning";
  const meshOf: (built: IAutoMovieModelObject, id: string) => THREE.Mesh = (
    built: IAutoMovieModelObject,
    id: string,
  ): THREE.Mesh => built.parts.get(id) as THREE.Mesh;
  const keyOf: (material: THREE.Material | undefined) => string = (
    material: THREE.Material | undefined,
  ): string => material?.customProgramCacheKey() ?? "";

  // 1. dual quaternion: beauty and both shadow materials patched
  const dual: THREE.Mesh = meshOf(
    buildModel(createSkinnedTubeModel("dual-quaternion")),
    "tube",
  );
  TestValidator.equals(
    "a dual-quaternion skin patches its material and shadows",
    [
      dual instanceof THREE.SkinnedMesh,
      keyOf(dual.material as THREE.Material).includes(KEY),
      keyOf(dual.customDepthMaterial).includes(KEY),
      keyOf(dual.customDistanceMaterial).includes(KEY),
    ],
    [true, true, true, true],
  );

  // 2. linear and omitted: untouched
  for (const method of ["linear", undefined] as const) {
    const plain: THREE.Mesh = meshOf(
      buildModel(createSkinnedTubeModel(method)),
      "tube",
    );
    TestValidator.equals(
      `a ${String(method)} skin keeps linear blending`,
      [
        plain instanceof THREE.SkinnedMesh,
        keyOf(plain.material as THREE.Material).includes(KEY),
        plain.customDepthMaterial,
        plain.customDistanceMaterial,
      ],
      [true, false, undefined, undefined],
    );
  }

  // 3. one definition, two methods, two variants
  const mixed: IAutoMovieModel = createSkinnedTubeModel("dual-quaternion");
  const linearPart: IAutoMovieModel["parts"][number] = structuredClone(
    mixed.parts[0]!,
  );
  linearPart.id = "linear-tube";
  if (linearPart.geometry.type === "mesh")
    linearPart.geometry.mesh.skin!.method = "linear";
  mixed.parts.push(linearPart);
  const builtMixed: IAutoMovieModelObject = buildModel(mixed);
  const a: THREE.Material = meshOf(builtMixed, "tube")
    .material as THREE.Material;
  const b: THREE.Material = meshOf(builtMixed, "linear-tube")
    .material as THREE.Material;
  TestValidator.equals(
    "a shared definition splits by skinning method",
    [a === b, keyOf(a).includes(KEY), keyOf(b).includes(KEY)],
    [false, true, false],
  );

  // 4. the compile hook rewrites the physical vertex shader
  const shader: THREE.WebGLProgramParametersWithUniforms = {
    vertexShader: THREE.ShaderLib.physical.vertexShader,
    fragmentShader: THREE.ShaderLib.physical.fragmentShader,
    uniforms: {},
  } as unknown as THREE.WebGLProgramParametersWithUniforms;
  (dual.material as THREE.Material).onBeforeCompile(
    shader,
    undefined as unknown as THREE.WebGLRenderer,
  );
  const source: string = shader.vertexShader;
  const blend: number = source.indexOf(
    "automovieBlendDualQuaternion( boneMatX",
  );
  TestValidator.predicate(
    "the physical vertex shader blends dual quaternions before its readers",
    !source.includes("#include <skinning_vertex>") &&
      !source.includes("#include <skinnormal_vertex>") &&
      blend > source.indexOf("#include <skinbase_vertex>") &&
      blend <
        source.indexOf(
          "objectNormal = automovieRotate( automovieSkinRotation, objectNormal );",
        ) &&
      blend <
        source.indexOf(
          "transformed = automovieRotate( automovieSkinRotation, transformed )",
        ),
  );

  // 5. depth shader and refusal
  const depth: string = dualQuaternionSkinningVertex(
    THREE.ShaderLib.depth.vertexShader,
  );
  TestValidator.predicate(
    "the depth vertex shader skins positions by dual quaternions",
    !depth.includes("#include <skinning_vertex>") &&
      depth.includes(
        "transformed = automovieRotate( automovieSkinRotation, transformed )",
      ),
  );
  TestValidator.predicate(
    "a shader without skinning chunks is refused",
    throwsError(
      (): string => dualQuaternionSkinningVertex("void main() {}"),
      "Dual quaternion skinning needs",
    ),
  );

  // 6. guide passes patch the replacement of a dual-quaternion skin only
  const scene: THREE.Scene = new THREE.Scene();
  const dualBuilt: IAutoMovieModelObject = buildModel(
    createSkinnedTubeModel("dual-quaternion"),
  );
  const linearBuilt: IAutoMovieModelObject = buildModel(
    createSkinnedTubeModel("linear"),
  );
  scene.add(dualBuilt.object, linearBuilt.object);
  const dualTube: THREE.Mesh = meshOf(dualBuilt, "tube");
  const linearTube: THREE.Mesh = meshOf(linearBuilt, "tube");
  const originals: [THREE.Material, THREE.Material] = [
    dualTube.material as THREE.Material,
    linearTube.material as THREE.Material,
  ];
  const patched: () => [boolean, boolean] = (): [boolean, boolean] => [
    keyOf(dualTube.material as THREE.Material).includes(KEY),
    keyOf(linearTube.material as THREE.Material).includes(KEY),
  ];
  for (const mode of ["depth", "normal", "mask"] as const) {
    const handle: IAutoMovieRenderModeHandle = applyRenderMode(scene, mode);
    TestValidator.equals(
      `the ${mode} pass patches only the dual skin`,
      patched(),
      [true, false],
    );
    handle.restore();
  }
  const outline: IAutoMovieRenderModeHandle = applyRenderMode(scene, "outline");
  const shells: THREE.Mesh[] = [dualBuilt, linearBuilt].map(
    (built: IAutoMovieModelObject): THREE.Mesh =>
      built.object.children.find(
        (child: THREE.Object3D): boolean =>
          child !== meshOf(built, "tube") &&
          (child as THREE.Mesh).isMesh === true,
      ) as THREE.Mesh,
  );
  TestValidator.equals(
    "the outline fill and shell patch only the dual skin",
    [
      ...patched(),
      keyOf(shells[0]!.material as THREE.Material).includes(KEY),
      keyOf(shells[1]!.material as THREE.Material).includes(KEY),
    ],
    [true, false, true, false],
  );
  outline.restore();
  const semantic: ReturnType<typeof applyAutoMovieSemanticMask> =
    applyAutoMovieSemanticMask({
      scene,
      design: {
        id: "empty",
        name: null,
        nodes: [],
        cameras: [],
        lights: [],
      },
      mask: {
        version: 2,
        protocol: "automovie.semantic-mask.v2",
        background: "#000000",
        entries: [],
        unaddressed: [],
        digest: "",
      },
    });
  TestValidator.equals(
    "the semantic mask patches only the dual skin",
    patched(),
    [true, false],
  );
  semantic.restore();
  TestValidator.equals(
    "every pass restores the original materials",
    [dualTube.material, linearTube.material],
    originals,
  );
}
