import { addMaterialShaderPatch, spliceTangentNormal } from "@automovie/viewer";
import * as THREE from "three";

/** One uniform per material; weak ownership does not retain disposed person materials. */
const uniforms: WeakMap<
  THREE.MeshStandardMaterial,
  {
    uniform: THREE.IUniform<number>;
    compilations: number;
    bound: THREE.IUniform<number> | null;
  }
> = new WeakMap();

/**
 * Enable the Human viewer's final tangent-space skin relief without changing its authored scales or colors.
 *
 * First call must follow material construction and precede its first compilation, after detail and overlay registrations. A final tangent normal operation then covers base, detail and acne normals together. Later calls only update its material-local uniform; off/on restores all original normal contributions because none of their scales is changed. Materials without tangent-space normal maps are left alone. The function borrows the material and textures and creates no GPU handle.
 *
 * @evidence contracts/common.md#principled-implementation Registers the existing public ordered shader bridge immediately before its installed tangent-to-world projection; disabled relief substitutes the tangent flat normal after every prior normal layer, with color and roughness operations untouched.
 * @evidence contracts/common.md#clear-and-simple-design One material-local enable uniform owns the viewer operation instead of editing separately captured overlay uniforms or losing anisotropic base scales.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses supported shader hooks and exact native projection insertion, does not replace prototypes or foreign methods, and requires registration before first compilation rather than silently patching compiled programs.
 * @evidence contracts/common.md#meaningful-documentation States the first-call ordering, tangent-map scope, preserved layer/base scales, toggle behavior and borrowed resource ownership.
 * @evidence contracts/performance.md#efficient-algorithms First registration adds one fixed shader operation; each later call is O(1) with no texture bake, material rebuild or shader source change.
 * @evidence contracts/performance.md#reuse-equivalent-work The same material reuses one uniform and one structural patch for both enable values; distinct materials have independent uniforms even when their program is shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A weak map and the material's own patch closure hold one uniform per live material; no global strong material references, texture ownership or unregister operation is introduced.
 */
export function setHumanViewerRelief(
  material: THREE.MeshStandardMaterial,
  enabled: boolean,
): void {
  if (
    material.normalMap === null ||
    material.normalMapType !== THREE.TangentSpaceNormalMap
  )
    return;
  const saved:
    | {
        uniform: THREE.IUniform<number>;
        compilations: number;
        bound: THREE.IUniform<number> | null;
      }
    | undefined = uniforms.get(material);
  if (saved !== undefined) {
    saved.uniform.value = enabled ? 1 : 0;
    return;
  }
  const uniform: THREE.IUniform<number> = { value: enabled ? 1 : 0 };
  const state: {
    uniform: THREE.IUniform<number>;
    compilations: number;
    bound: THREE.IUniform<number> | null;
  } = { uniform, compilations: 0, bound: null };
  uniforms.set(material, state);
  addMaterialShaderPatch(material, {
    key: "automovie-human-viewer-relief-v1",
    apply: (shader: THREE.WebGLProgramParametersWithUniforms): void => {
      shader.uniforms.humanViewerReliefEnabled = uniform;
      ++state.compilations;
      state.bound = shader.uniforms
        .humanViewerReliefEnabled as THREE.IUniform<number>;
      shader.fragmentShader = spliceTangentNormal(
        shader.fragmentShader.replace(
          "#include <common>",
          "#include <common>\nuniform float humanViewerReliefEnabled;",
        ),
        "if ( humanViewerReliefEnabled < 0.5 ) mapN = vec3( 0.0, 0.0, 1.0 );",
      );
    },
  });
}

/**
 * Read the relief operation owned by this module without changing its material or issuing textures.
 *
 * @evidence contracts/common.md#principled-implementation The public read operation observes the WeakMap state installed by the real relief operation and the uniform reference received by its actual compile callback.
 * @evidence contracts/common.md#clear-and-simple-design The operation's owner supplies current state without Three renderer-internal access or another shader implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reading does not compile, render, replace hooks, change a uniform or infer GPU execution from a metadata boolean.
 * @evidence contracts/common.md#meaningful-documentation The read method distinguishes registration, callback execution, current value and the remaining GPU/pixel proof boundary.
 * @evidence contracts/performance.md#efficient-algorithms One WeakMap lookup and fixed scalar projection cost O(1).
 * @evidence contracts/performance.md#reuse-equivalent-work Reads current mutable values on every observation rather than an older frame's snapshot.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns scalars only; the original WeakMap retains no disposed material strongly.
 */
export namespace setHumanViewerRelief {
  /**
   * Observe the actual owner uniform and the last real compile callback's reference.
   *
   * A null result means this material has no registered operation. A positive compilation count proves callback execution, not GPU success or visible skin pixels. The returned scalars retain no shader or material reference.
   *
   */
  export function read(
    material: THREE.MeshStandardMaterial,
  ): {
    enabled: boolean;
    compilations: number;
    compiledUniformMatchesOwner: boolean;
    compiledValue: number | null;
  } | null {
    const state:
      | {
          uniform: THREE.IUniform<number>;
          compilations: number;
          bound: THREE.IUniform<number> | null;
        }
      | undefined = uniforms.get(material);
    return state === undefined
      ? null
      : {
          enabled: state.uniform.value >= 0.5,
          compilations: state.compilations,
          compiledUniformMatchesOwner:
            state.bound !== null && state.bound === state.uniform,
          compiledValue: state.bound?.value ?? null,
        };
  }
}
