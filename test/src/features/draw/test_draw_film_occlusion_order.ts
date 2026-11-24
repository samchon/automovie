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
 * 4. A display overlay (`toneMapped: false`) is hidden from the prepass, so it
 *    occludes nothing, and is visible again when the beauty pass runs.
 * 5. An additive flame and a blended glass of opacity 0.15 are hidden from the
 *    prepass, so a wall behind a candle flame reads its own occlusion rather
 *    than the flame's, while an opaque mesh beside them is drawn; both are
 *    visible again when the beauty pass runs.
 *
 * Pixel equality of the same second captured in different orders is checked on
 * a real GPU under the visual-debugging skill.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the stage over a recording renderer and reads the pass uniforms through the recorded draws; a pass that read an earlier frame's target, a skipped clear target, an unrestored background, or a prepass that draws a flame or a glass as an opaque occluder fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected order is the one the contract states: prepass, search, blur, beauty; equality of A's draws follows from each draw depending only on its inputs; a blended or additive mesh covers nothing behind it, so it cannot occlude, which is issue #4080's horizon premise.
 * @evidence contracts/development/testing.md#distinguishing-cases Two different seconds between two equal ones, a raster change, a display overlay, an additive and a blended mesh beside an opaque one; the gate and the patch are owned by `test_draw_film_occlusion_direct`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_occlusion_order`; the renderer is an in-memory double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
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
    // The stage swaps one quad's program between its passes, so the search
    // pass's uniforms are the ones the double recorded as it rendered.
    const program: Record<string, unknown> | null =
      double.renders[1]?.program ?? null;
    return {
      renders: double.renders,
      beauty,
      search:
        program === null
          ? ""
          : JSON.stringify([
              program.uRadius,
              program.uSample,
              program.uProjection,
            ]),
    };
  };

  // 1. The order of one draw.
  const first: IDrawn = draw(a, 0.5, 64);
  const [prepass, search, blur]: createFilmResponseRendererDouble.IRender[] =
    first.renders;
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
  const other: IDrawn = draw(b, 1.5, 64);
  const again: IDrawn = draw(a, 0.5, 64);
  TestValidator.predicate(
    "the second A draws as the first, unaffected by B",
    first.search !== "" &&
      other.search !== first.search &&
      signature(again) === signature(first) &&
      again.search === first.search,
  );

  // 3. A raster change.
  const wide: IDrawn = draw(a, 0.5, 128);
  TestValidator.predicate(
    "a new raster resizes the targets",
    wide.renders[0]!.target!.width === 128 && wide.beauty.includes("[128,36]"),
  );

  // 4. A display overlay is left out of the prepass and restored.
  const overlay: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({ toneMapped: false }),
  );
  scene.add(overlay);
  const watched: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
      watched: [overlay],
    });
  let restored: boolean = false;
  stage.draw(
    {
      renderer: watched.renderer,
      scene,
      camera: a,
      shading: { occlusion: { radius: 0.5 } },
      optics: true,
      seconds: 1,
      width: 64,
      height: 36,
      sample: 0,
    },
    (): void => {
      restored = overlay.layers.test(a.layers);
    },
  );
  TestValidator.predicate(
    "a display overlay is hidden from the prepass and visible again for the beauty pass",
    watched.renders[0]!.object === scene &&
      watched.renders[0]!.seen[0] === false &&
      restored,
  );
  scene.remove(overlay);

  // 5. A flame's additive glow and a blended glass are left out of the prepass,
  // an opaque mesh is drawn, and both are visible again for the beauty pass.
  const flame: THREE.Mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.1),
    new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  const glass: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.15 }),
  );
  const wall: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial(),
  );
  scene.add(flame, glass, wall);
  const blended: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
      watched: [flame, glass, wall],
    });
  let shown: boolean[] = [];
  stage.draw(
    {
      renderer: blended.renderer,
      scene,
      camera: a,
      shading: { occlusion: { radius: 0.5 } },
      optics: true,
      seconds: 1,
      width: 64,
      height: 36,
      sample: 0,
    },
    (): void => {
      shown = [flame, glass, wall].map((object: THREE.Mesh): boolean =>
        object.layers.test(a.layers),
      );
    },
  );
  TestValidator.equals(
    "a flame and a glass are hidden from the prepass, an opaque wall is drawn",
    blended.renders[0]!.object === scene ? blended.renders[0]!.seen : null,
    [false, false, true],
  );
  TestValidator.equals(
    "every one is visible again for the beauty pass",
    shown,
    [true, true, true],
  );
  scene.remove(flame, glass, wall);
  stage.dispose();
}

/** One recorded draw: its renders and the state the beauty pass saw. */
interface IDrawn {
  /** Every render call, in order. */
  renders: createFilmResponseRendererDouble.IRender[];

  /** The serialized state inside the beauty callback. */
  beauty: string;

  /** The horizon search's radius, sample and projection as it rendered. */
  search: string;
}
