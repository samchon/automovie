import { AutoMovieFilmIndirectStage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * Occlusion changes only indirect light: the patched lit materials multiply
 * their indirect diffuse and specular terms after every direct light and the
 * material's own occlusion texture have applied, and only while the beauty pass
 * draws, so a scene lit only by a directional light draws the same with and
 * without occlusion.
 *
 * Scenarios:
 *
 * 1. Drawing a scene with a standard and a basic material under `occlusion`
 *    patches the lit standard material once, with the program key
 *    `automovie-film-indirect`, and leaves the unlit basic material alone.
 * 2. The patched fragment program multiplies `reflectedLight.indirectDiffuse` and
 *    `reflectedLight.indirectSpecular` after three's `aomap_fragment` chunk,
 *    which follows every direct light, gated by `uFilmOcclusionOn`; no other
 *    light term is touched.
 * 3. The gate is on only inside the beauty callback and off before and after it,
 *    so a structural pass or another draw of the same materials sees them
 *    unchanged.
 * 4. A shading without members, and an absent shading, call the beauty pass alone
 *    with no prepass and patch nothing.
 *
 * Pixels of a directional-lit scene drawn with and without occlusion are
 * compared on a real GPU under the visual-debugging skill.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the stage over a recording renderer and the patch over three's own physical program; a multiply placed before direct light, an always-on gate or a patched unlit material fails.
 * @evidence contracts/development/testing.md#independent-expectations Three's chunk order places `aomap_fragment` after the light loop; with no image lighting the indirect terms are zero, so a multiply of them cannot change the frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Lit and unlit materials, inside and outside the beauty callback, occlusion against no members; the estimator is owned by `test_draw_film_occlusion_crease`, ordering by `test_draw_film_occlusion_order`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_occlusion_direct`; the renderer is an in-memory double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_film_occlusion_direct(): void {
  const lit: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const unlit: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  const scene: THREE.Scene = new THREE.Scene();
  scene.add(
    new THREE.Mesh(new THREE.PlaneGeometry(), lit),
    new THREE.Mesh(new THREE.PlaneGeometry(), unlit),
    new THREE.DirectionalLight(0xffffff, 1000),
  );
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  const double: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  const stage: AutoMovieFilmIndirectStage = new AutoMovieFilmIndirectStage();
  const gate: () => number = (): number =>
    stage.uniforms.uFilmOcclusionOn!.value as number;
  let inside: number = -1;
  stage.draw(
    {
      renderer: double.renderer,
      scene,
      camera,
      shading: { occlusion: { radius: 0.5 } },
      optics: true,
      seconds: 1,
      width: 64,
      height: 36,
      sample: 0,
    },
    (): void => {
      inside = gate();
    },
  );

  // 1. Only the lit material is patched.
  TestValidator.predicate(
    "the lit material is patched and the unlit one is not",
    lit.customProgramCacheKey() === "automovie-film-indirect" &&
      unlit.userData.shaderPatches === undefined,
  );

  // 2. After the occlusion chunk, indirect terms only.
  const shader: THREE.WebGLProgramParametersWithUniforms = {
    vertexShader: THREE.ShaderLib.physical.vertexShader,
    fragmentShader: THREE.ShaderLib.physical.fragmentShader,
    uniforms: {},
  } as unknown as THREE.WebGLProgramParametersWithUniforms;
  lit.onBeforeCompile(shader, undefined as unknown as THREE.WebGLRenderer);
  const at: number = shader.fragmentShader.indexOf("autoMovieFilmVisibility =");
  TestValidator.predicate(
    "visibility multiplies only indirect light, after the light loop and the occlusion map",
    at > shader.fragmentShader.indexOf("#include <aomap_fragment>") &&
      at > shader.fragmentShader.indexOf("#include <lights_fragment_end>") &&
      /reflectedLight\.indirectDiffuse \*= autoMovieFilmVisibility;\s*reflectedLight\.indirectSpecular \*= autoMovieFilmVisibility;/.test(
        shader.fragmentShader,
      ) &&
      !/reflectedLight\.direct\w+ \*= autoMovieFilmVisibility/.test(
        shader.fragmentShader,
      ),
  );

  // 3. The gate.
  TestValidator.predicate(
    "the gate is on only during the beauty pass",
    inside === 1 && gate() === 0,
  );

  // 4. Nothing asked.
  for (const shading of [{}, undefined]) {
    const plain: createFilmResponseRendererDouble.IDouble =
      createFilmResponseRendererDouble({
        toneMapping: THREE.NoToneMapping,
        exposure: 1,
      });
    let called: boolean = false;
    const fresh: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
    const other: THREE.Scene = new THREE.Scene();
    other.add(new THREE.Mesh(new THREE.PlaneGeometry(), fresh));
    stage.draw(
      {
        renderer: plain.renderer,
        scene: other,
        camera,
        shading,
        optics: true,
        seconds: 1,
        width: 64,
        height: 36,
        sample: 0,
      },
      (): void => {
        called = true;
      },
    );
    TestValidator.predicate(
      `${shading === undefined ? "absent" : "empty"} shading draws the beauty pass alone`,
      called &&
        plain.renders.length === 0 &&
        fresh.userData.shaderPatches === undefined,
    );
  }
  stage.dispose();
}
