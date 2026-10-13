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

/**
 * Native material hooks compose relief and detail normals without replacing
 * each other's uniforms or silently accepting an unsupported shader boundary.
 * These inputs are in-memory shader programs and materials, with no renderer.
 *
 * Scenarios:
 * 1. Native chunk expansion and an already expanded program each insert a
 *    caller's tangent-normal operation exactly once before projection.
 * 2. An unsupported shader refuses both tangent and relief insertion, while
 *    an adjacent native program supports each operation.
 * 3. The composition used by a material's native compile hook preserves an
 *    existing uniform, owns a copy of the detail transform, and orders base
 *    relief ahead of detail blending; an empty registration list changes none
 *    of the caller's source or uniforms.
 */
export const test_viewer_normal_shader_composition = (): void => {
  const native = THREE.ShaderLib.physical.fragmentShader;
  const operation = "mapN.xy += vec2( 0.25, 0.5 );";
  const expanded = native.replace(
    "#include <normal_fragment_maps>",
    THREE.ShaderChunk.normal_fragment_maps,
  );
  for (const input of [native, expanded]) {
    const composed = spliceTangentNormal(input, operation);
    TestValidator.predicate(
      "a slope operation precedes projection exactly once",
      composed.split(operation).length === 2 &&
        composed.indexOf(operation) <
          composed.indexOf("normal = normalize( tbn * mapN );"),
    );
  }
  for (const transform of [
    (input: string) => spliceTangentNormal(input, operation),
    reliefWeightFragment,
  ]) {
    let refused = false;
    try {
      transform("void main() { gl_FragColor = vec4( 1.0 ); }");
    } catch (error) {
      refused = error instanceof Error;
    }
    TestValidator.predicate("a missing normal boundary is refused", refused);
  }
  for (const input of [native, expanded]) {
    const relief = reliefWeightFragment(input);
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

  const texture = new THREE.Texture();
  texture.offset.set(0.25, 0.5);
  texture.repeat.set(2, 3);
  const material = new THREE.MeshPhysicalMaterial({ normalMap: texture });
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
  const patches = [
    createReliefWeightShaderPatch(),
    createDetailNormalShaderPatch(texture, 0.75),
  ];
  const opaque = { nativeState: { marker: "retained" }, edits: 0 };
  applyMaterialShaderPatches(
    [
      {
        apply: (program: typeof opaque) => {
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
  let patchRefused = false;
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
      strength: shader.uniforms.detailNormalScale!.value,
      sameTexture: shader.uniforms.detailNormalMap!.value === texture,
    },
    {
      key: "automovie-relief-weights+automovie-detail-normal",
      preserved: 7,
      strength: 0.75,
      sameTexture: true,
    },
  );
  const transform = shader.uniforms.detailNormalTransform!.value as THREE.Matrix3;
  TestValidator.predicate(
    "the detail transform is a value-preserving independent matrix",
    transform !== texture.matrix && transform.equals(texture.matrix),
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
};
