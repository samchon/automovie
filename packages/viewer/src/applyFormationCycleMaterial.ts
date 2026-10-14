import type * as THREE from "three";

import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";

/**
 * Teach one material to place its vertices at each member's own cycle position.
 *
 * Injection rather than a bespoke material, because a formation is drawn by
 * more than one material over a shot's life: the lit beauty material, and the
 * shadow depth/distance materials and depth, normal, mask and outline overrides
 * a guide pass swaps in. A pass that kept the rest pose while beauty marched
 * would make a review frame describe a
 * film that does not exist, so every one of them goes through here.
 *
 * The transform is applied in model space, before three's own instancing step
 * consumes `transformed`, so the member is posed and then placed rather than
 * the other way round. Normals are rotated by the same matrix, which keeps the
 * shading and the silhouette shells honest about the moving surface.
 *
 * The bake stores affine part transforms in three Float32 texture rows. Shader
 * interpolation blends adjacent matrices, so rotations are approximated and
 * can lose orthogonality between samples. The installed compile/key hooks own
 * this material; unrelated existing hooks are not composed.
 *
 * @evidence contracts/common.md#principled-implementation Injects sampled part-affine matrices before native instance placement and applies their 3x3 to normals; normalized phase wraps cycle columns and interpolates neighboring Float32 matrices. Correct part/phase attributes and compatible Three shader chunks are premises, with linear matrix interpolation not exact rotational slerp and no inverse-transpose correction for arbitrary nonuniform deformation.
 * @evidence contracts/common.md#clear-and-simple-design Shares the same cycle uniforms/injection across visible and structural/shadow material classes instead of separate animation implementations; bake storage and per-tier cadence remain with their owning helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual baked tables and per-member radius/phase, not fixture poses; native compile hooks are supported extension points, but replacing unrelated existing hook logic and silent missing chunk replacement remain documented compatibility limits.
 * @evidence contracts/common.md#meaningful-documentation Gives model-before-instance ordering, shared normal/depth behavior, affine Float32 row storage, matrix interpolation approximation and installed-hook ownership.
 * @evidence contracts/performance.md#efficient-algorithms Installs one hook and fixed GLSL strings; each vertex performs constant-count adjacent texture reads/matrix arithmetic, while program compile source replacement is linear in shader source length and independent of population count.
 * @evidence contracts/performance.md#reuse-equivalent-work All materials of a tier borrow the same mutable cycle uniform cells/textures and the fixed structural program key allows Three program reuse; changing cadence uniforms avoids recompilation, while installing injection marks needsUpdate.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Material compile closure retains the borrowed cycle/uniforms until material references are released; owns no texture or task itself, and tier bake/runtime disposal must retire the shared textures after borrowers are closed.
 */
export const applyFormationCycleMaterial: (material: THREE.Material, cycle: IAutoMovieFormationCycle) => void = (
  material: THREE.Material,
  cycle: IAutoMovieFormationCycle,
): void => {
  material.onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms): void => {
    Object.assign(shader.uniforms, cycle.uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${CYCLE_PARS}`)
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>\n${CYCLE_NORMAL}`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\n${CYCLE_POSITION}`,
      );
  };
  // Without a distinct cache key three would hand this material the program it
  // already compiled for the same material class without the injection, and
  // the crowd would freeze for reasons invisible in the source.
  material.customProgramCacheKey = (): string => CYCLE_PROGRAM_KEY;
  material.needsUpdate = true;
};

const CYCLE_PROGRAM_KEY: string = "automovie-formation-cycle";

// A member's own radius comes out of the instance matrix it already carries,
// which is stated relative to the unit's origin: the pivot a turning cue turns
// the unit about. So the ground a turn covers is per member without a byte of
// per-member storage. A material drawn outside an instanced batch has no
// member to be, and stands at the pivot.
const CYCLE_PARS: string = `
uniform sampler2D automovieCycleTexture;
uniform float automovieCycleSamples;
uniform float automovieCycleRows;
uniform float automovieCycleAdvance;
uniform float automovieCycleTurn;
attribute float automoviePhase;
attribute float automoviePart;

mat4 automovieCycleSampleAt(const in float column, const in float part) {
  float u = (column + 0.5) / automovieCycleSamples;
  float row = part * 3.0;
  vec4 a = texture2D(automovieCycleTexture, vec2(u, (row + 0.5) / automovieCycleRows));
  vec4 b = texture2D(automovieCycleTexture, vec2(u, (row + 1.5) / automovieCycleRows));
  vec4 c = texture2D(automovieCycleTexture, vec2(u, (row + 2.5) / automovieCycleRows));
  return mat4(
    a.x, b.x, c.x, 0.0,
    a.y, b.y, c.y, 0.0,
    a.z, b.z, c.z, 0.0,
    a.w, b.w, c.w, 1.0
  );
}

float automovieCycleRadius() {
  #ifdef USE_INSTANCING
    return length(instanceMatrix[3].xz);
  #else
    return 0.0;
  #endif
}

mat4 automovieCycleMatrix() {
  float scaled =
    fract(
      automoviePhase +
      automovieCycleAdvance +
      automovieCycleRadius() * automovieCycleTurn
    ) * automovieCycleSamples;
  float first = floor(scaled);
  float blend = scaled - first;
  return automovieCycleSampleAt(first, automoviePart) * (1.0 - blend) +
    automovieCycleSampleAt(mod(first + 1.0, automovieCycleSamples), automoviePart) *
      blend;
}
`;

const CYCLE_NORMAL: string = `
objectNormal = mat3(automovieCycleMatrix()) * objectNormal;
`;

const CYCLE_POSITION: string = `
transformed = (automovieCycleMatrix() * vec4(transformed, 1.0)).xyz;
`;
