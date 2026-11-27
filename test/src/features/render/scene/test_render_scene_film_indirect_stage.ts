import {
  AutoMovieRenderFilmIndirectStage,
  type IAutoMovieRenderMaterialShaderSource,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "../../internal/createFilmResponseRendererDouble";
import { compileMaterialShaderSource } from "../../internal/compileMaterialShaderSource";

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
 */
export function test_render_scene_film_indirect_stage(): void {
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
  const stage: AutoMovieRenderFilmIndirectStage = new AutoMovieRenderFilmIndirectStage();
  const gate: () => number = (): number =>
    stage.uniforms.uFilmOcclusionOn!.value;
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
  const shader: IAutoMovieRenderMaterialShaderSource = compileMaterialShaderSource(lit);
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
