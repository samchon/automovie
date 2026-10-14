import {
  applyDetailNormal,
  applyMaterialShaderPatches,
  applyReliefWeights,
  createDetailNormalShaderPatch,
  createReliefWeightShaderPatch,
  detailNormalFragment,
  reliefWeightFragment,
  spliceTangentNormal,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * Native material hooks compose relief and detail operations while preserving caller uniforms and refusing unsupported shader boundaries. Inputs are in-memory programs and materials, without a renderer.
 *
 * Scenarios:
 * 1. Native chunk expansion and an already expanded program insert the caller's tangent-normal operation once before projection.
 * 2. An unsupported program refuses tangent and relief insertion, while the supported native template admits them.
 * 3. Composition preserves a caller uniform, copies the detail transform and orders relief before detail; an empty registration list preserves source and uniforms.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the maintained tangent/relief/detail shader producers and ordered patch composition on native Three shader templates, then reads returned programs, uniforms and material keys; catches omitted insertion, reordered patches, lost caller fields and accepted unsupported boundaries.
 * @evidence contracts/testing.md#independent-expectations The supported tangent-normal boundary and declared relief-before-detail order define generated-source expectations; literal caller values and original object identities define preservation. These output checks do not compile GLSL or observe GPU fragments.
 * @evidence contracts/testing.md#distinguishing-cases Covers chunked and already expanded native templates, missing boundaries, an empty operation list, opaque caller fields, shared texture identity and an independent transform copy; other material tests own overlay ordering and actual disposal.
 * @evidence contracts/testing.md#execution-ownership This named unit invokes product source with CPU-side shader records, Texture and Material objects, disposes its own objects and starts no renderer, browser, process or dynamically registered scenario.
 */
export function test_viewer_normal_shader_composition(): void {
  const native: string = THREE.ShaderLib.physical.fragmentShader;
  const operation: string = "mapN.xy += vec2( 0.25, 0.5 );";
  const expanded: string = native.replace(
    "#include <normal_fragment_maps>",
    THREE.ShaderChunk.normal_fragment_maps,
  );
  for (const input of [native, expanded]) {
    const composed: string = spliceTangentNormal(input, operation);
    TestValidator.predicate(
      "a slope operation precedes projection exactly once",
      composed.split(operation).length === 2 &&
        composed.indexOf(operation) <
          composed.indexOf("normal = normalize( tbn * mapN );"),
    );
  }
  for (const transform of [
    (input: string): string => spliceTangentNormal(input, operation),
    reliefWeightFragment,
  ]) {
    let refused: boolean = false;
    try {
      transform("void main() { gl_FragColor = vec4( 1.0 ); }");
    } catch (error) {
      refused = error instanceof Error;
    }
    TestValidator.predicate("a missing normal boundary is refused", refused);
  }
  for (const input of [native, expanded]) {
    const relief: string = reliefWeightFragment(input);
    TestValidator.predicate(
      "supported base relief precedes tangent projection",
      relief.indexOf("mapN.xy *= normalScale;") <
        relief.indexOf("mapN.xy *= vReliefWeight;") &&
        relief.indexOf("mapN.xy *= vReliefWeight;") <
          relief.indexOf("normal = normalize( tbn * mapN );"),
    );
    TestValidator.predicate(
      "detail remains supported after native or expanded input",
      detailNormalFragment(input).includes("mapN.z * detailN.z"),
    );
  }

  const texture: THREE.Texture = new THREE.Texture();
  texture.offset.set(0.25, 0.5);
  texture.repeat.set(2, 3);
  const material: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({ normalMap: texture });
  applyReliefWeights(material);
  applyDetailNormal(material, texture, 0.75);
  const shader: Pick<
    THREE.WebGLProgramParametersWithUniforms,
    "vertexShader" | "fragmentShader" | "uniforms"
  > = {
    vertexShader: THREE.ShaderLib.physical.vertexShader,
    fragmentShader: native,
    uniforms: { existing: { value: 7 } },
  };
  applyMaterialShaderPatches([], shader);
  TestValidator.equals(
    "no registered operations preserve the input program",
    {
      vertex: shader.vertexShader,
      fragment: shader.fragmentShader,
      uniforms: Object.keys(shader.uniforms),
    },
    {
      vertex: THREE.ShaderLib.physical.vertexShader,
      fragment: native,
      uniforms: ["existing"],
    },
  );
  const patches: ReturnType<typeof createReliefWeightShaderPatch>[] = [
    createReliefWeightShaderPatch(),
    createDetailNormalShaderPatch(texture, 0.75),
  ];
  const opaque: { nativeState: { marker: string }; edits: number } = { nativeState: { marker: "retained" }, edits: 0 };
  applyMaterialShaderPatches(
    [
      {
        apply: (program: typeof opaque): void => {
          TestValidator.predicate(
            "composition retains opaque caller-owned input identity",
            program === opaque && program.nativeState === opaque.nativeState,
          );
          program.edits += 1;
        },
      },
    ],
    opaque,
  );
  TestValidator.equals("an operation edits its complete supplied input", opaque.edits, 1);
  let patchRefused: boolean = false;
  try {
    applyMaterialShaderPatches(patches, {
      vertexShader: THREE.ShaderLib.physical.vertexShader,
      fragmentShader: "void main() { gl_FragColor = vec4( 1.0 ); }",
      uniforms: {},
    });
  } catch (error) {
    patchRefused = error instanceof Error;
  }
  TestValidator.predicate(
    "ordered composition propagates an unsupported patch boundary",
    patchRefused,
  );
  applyMaterialShaderPatches(
    patches,
    shader,
  );
  TestValidator.equals(
    "the material owns both ordered patches and the supplied strength",
    {
      key: material.customProgramCacheKey(),
      preserved: shader.uniforms.existing!.value,
      sameTexture: shader.uniforms.detailNormalMap!.value === texture,
    },
    {
      key: "automovie-relief-weights+automovie-detail-normal",
      preserved: 7,
      sameTexture: true,
    },
  );
  TestValidator.predicate("the detail strength preserves its supplied value",
    nclose(shader.uniforms.detailNormalScale!.value as number, 0.75, 0));
  const transform: THREE.Matrix3 = shader.uniforms.detailNormalTransform!.value as THREE.Matrix3;
  TestValidator.predicate(
    "the detail transform is a value-preserving independent matrix",
    transform !== texture.matrix && transform.elements.every(
      (value: number, index: number): boolean => nclose(value, texture.matrix.elements[index]!, 0),
    ),
  );
  TestValidator.predicate(
    "relief and detail retain their distinct interpolation and order",
    shader.vertexShader.includes("vReliefWeight = reliefWeight;") &&
      shader.vertexShader.includes("vDetailNormalUv =") &&
      shader.fragmentShader.indexOf("mapN.xy *= vReliefWeight;") <
        shader.fragmentShader.indexOf("vec3 detailN"),
  );
  material.dispose();
  texture.dispose();
}
