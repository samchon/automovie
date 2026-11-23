import { AutoMovieFilmIndirectStage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * Each frame's occlusion depends only on its own scene and camera: the stage
 * fills every target it reads from this draw, in a fixed order, and restores
 * what it changed, so the same second drawn twice, or after a different second,
 * draws the same.
 *
 * Scenarios:
 *
 * 1. One draw renders, in order, the scene into the normal prepass target with the
 *    background off and the double-sided normal material as override, the
 *    horizon search into the raw target and the blur into the visibility
 *    target, each at the beauty raster, and then calls the beauty pass with the
 *    renderer back on its own target and the scene's background and override
 *    restored.
 * 2. Drawing second A, then a different second B with another camera and radius,
 *    then A again, gives A's two draws the same sequence of targets and the
 *    same occlusion uniforms (radius, sample index, projection), so nothing of
 *    B carries into the second A.
 * 3. A change of raster resizes the targets, and the stage's uniforms then name
 *    the new raster.
 *
 * Pixel equality of the same second captured in different orders is checked on
 * a real GPU under the visual-debugging skill.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the stage over a recording renderer and reads the pass uniforms through the recorded draws; a pass that read an earlier frame's target, a skipped clear target or an unrestored background fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected order is the one the contract states: prepass, search, blur, beauty; equality of A's draws follows from each draw depending only on its inputs.
 * @evidence contracts/development/testing.md#distinguishing-cases Two different seconds between two equal ones, and a raster change; the gate and the patch are owned by `test_draw_film_occlusion_direct`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_occlusion_order`; the renderer is an in-memory double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_film_occlusion_order(): void {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0.2, 0.3, 0.4);
  scene.add(
    new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()),
  );
  const a: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    40,
    16 / 9,
    0.1,
    100,
  );
  const b: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    60,
    16 / 9,
    0.2,
    50,
  );
  const stage: AutoMovieFilmIndirectStage = new AutoMovieFilmIndirectStage();
  const draw: (
    camera: THREE.PerspectiveCamera,
    radius: number,
    width: number,
  ) => IDrawn = (
    camera: THREE.PerspectiveCamera,
    radius: number,
    width: number,
  ): IDrawn => {
    const double: createFilmResponseRendererDouble.IDouble =
      createFilmResponseRendererDouble({
        toneMapping: THREE.NoToneMapping,
        exposure: 1,
      });
    let beauty: string = "";
    stage.draw(
      {
        renderer: double.renderer,
        scene,
        camera,
        shading: { occlusion: { radius } },
        optics: true,
        seconds: 1,
        width,
        height: 36,
        sample: 0,
      },
      (): void => {
        beauty = JSON.stringify({
          target: double.renderer.getRenderTarget(),
          background: scene.background === null ? null : "kept",
          override: scene.overrideMaterial === null,
          resolution: (
            stage.uniforms.uFilmResolution!.value as THREE.Vector2
          ).toArray(),
        });
      },
    );
    return { renders: double.renders, beauty };
  };

  // 1. The order of one draw.
  const first: IDrawn = draw(a, 0.5, 64);
  const [prepass, search, blur] = first.renders;
  TestValidator.predicate(
    "prepass, search and blur at the raster, then the beauty pass restored",
    first.renders.length === 3 &&
      prepass!.object === scene &&
      prepass!.background === null &&
      prepass!.target !== null &&
      prepass!.target.width === 64 &&
      search!.object !== scene &&
      search!.target !== prepass!.target &&
      blur!.target !== search!.target &&
      first.beauty ===
        JSON.stringify({
          target: null,
          background: "kept",
          override: true,
          resolution: [64, 36],
        }),
  );

  // 2. A, B, A.
  const signature: (drawn: IDrawn) => string = (drawn: IDrawn): string =>
    JSON.stringify(
      drawn.renders.map(
        (render: createFilmResponseRendererDouble.IRender): unknown[] => [
          render.target?.width,
          render.target?.height,
          render.background === null,
        ],
      ),
    );
  const uniforms: () => string = (): string => {
    const occlusion: THREE.Material | undefined = search!.object.children
      .map(
        (child: THREE.Object3D): THREE.Material =>
          (child as THREE.Mesh).material as THREE.Material,
      )
      .find(
        (material: THREE.Material): boolean =>
          material instanceof THREE.RawShaderMaterial,
      );
    const values: Record<string, THREE.IUniform> = (
      occlusion as THREE.RawShaderMaterial
    ).uniforms;
    return JSON.stringify([
      values.uRadius!.value,
      values.uSample!.value,
      (values.uProjection!.value as THREE.Matrix4).toArray(),
    ]);
  };
  const firstUniforms: string = uniforms();
  draw(b, 1.5, 64);
  const again: IDrawn = draw(a, 0.5, 64);
  TestValidator.predicate(
    "the second A draws as the first, unaffected by B",
    signature(again) === signature(first) && uniforms() === firstUniforms,
  );

  // 3. A raster change.
  const wide: IDrawn = draw(a, 0.5, 128);
  TestValidator.predicate(
    "a new raster resizes the targets",
    wide.renders[0]!.target!.width === 128 && wide.beauty.includes("[128,36]"),
  );
  stage.dispose();
}

/** One recorded draw: its renders and the state the beauty pass saw. */
interface IDrawn {
  /** Every render call, in order. */
  renders: createFilmResponseRendererDouble.IRender[];

  /** The serialized state inside the beauty callback. */
  beauty: string;
}
