import { createLaptop } from "@automovie/archetypes";
import { validateShotArtifact } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieConstraintViolation,
  IAutoMovieFilmOptics,
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieShot,
  IAutoMovieSurfaceGraphicTrack,
  IAutoMovieValidation,
} from "@automovie/interface";
import {
  type IAutoMovieFilmResponseRenderer,
  type IAutoMovieSurfaceGraphicsObject,
  buildModel,
  buildScene,
  prepareAutoMovieSurfaceGraphics,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "../draw/createFilmResponseRendererDouble";
import { renderFixtureIdentity } from "../internal/renderFixtureIdentity";
import { renderFixtureNode } from "../internal/renderFixtureNode";

/**
 * A laptop screen's feed layer draws another staged camera's view into its own
 * render target, never shows itself, and is refused when it names a camera it
 * may not show.
 *
 * Scenarios:
 *
 * 1. A feed of 120 pixels over the whole screen gets a colour target 120 high and
 *    as wide as the screen's aspect, and the layer's material samples it.
 * 2. `renderFeeds` draws the scene once from camera `cctv` into that target, with
 *    every feed layer drawn as its graphic's background during the draw, then
 *    restores the feed's material and the renderer's previous target.
 * 3. While the key holding the feed is not in force, nothing is drawn.
 * 4. The structural shot gate refuses a feed of the shot's own camera, an unknown
 *    camera, and `pixels` of 0 and 2049.
 * 5. Given the film's optics, the feed draws the scene in linear light into a
 *    stage target of its own and the response's full-frame pass into the feed
 *    target, leaving the renderer's target as it was, and the feed's material
 *    decodes the display picture; a later plain draw reads linear light again.
 * 6. Disposal releases the target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the laptop, the feed, the recording renderer and each refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares the graphics through the public preparer and calls renderFeeds on a renderer double that records each target, camera and the feed mesh's material at draw time, and runs the public shot gate.
 * @evidence contracts/development/testing.md#independent-expectations The target size follows the screen affordance's extents and the authored height; the self-view rule and refusals follow issue #4099; a monitor showing an exposed picture whose white is the screen's luminance is the supervisor's decision for #4099, and the stage order is AutoMovieFilmResponseStage's documented contract.
 * @evidence contracts/development/testing.md#distinguishing-cases A feed drawing itself, a target left bound, a feed drawn while hidden, a feed under optics drawn without the response or read without decoding, or a refused camera admitted fails. The picture inside the screen needs a WebGL host and is judged by eye.
 * @evidence contracts/development/testing.md#execution-ownership The renderer is an in-memory double passed through the preparer's own seam; no GPU.
 */
export async function test_render_surface_feed(): Promise<void> {
  const laptop: IAutoMovieModel = createLaptop({ id: "laptop" });
  const screen: IAutoMovieAffordance = laptop.affordances!.find(
    (entry: IAutoMovieAffordance): boolean => entry.id === "screen",
  )!;
  const scene: IAutoMovieScene = {
    id: "office",
    name: null,
    nodes: [renderFixtureNode("desk-laptop", laptop.id)],
    cameras: [
      {
        id: "film",
        transform: renderFixtureIdentity,
        fovY: 40,
        near: 0.1,
        far: 100,
        depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 1 },
      },
      {
        id: "cctv",
        transform: renderFixtureIdentity,
        fovY: 60,
        near: 0.1,
        far: 100,
        depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 1 },
      },
    ],
    lights: [],
  } as IAutoMovieScene;
  const feed: (
    camera: string,
    pixels: number,
  ) => IAutoMovieSurfaceGraphicTrack = (
    camera: string,
    pixels: number,
  ): IAutoMovieSurfaceGraphicTrack => ({
    node: "desk-laptop",
    surface: "screen",
    keys: [
      {
        time: 0,
        graphic: {
          emission: { kind: "emissive", luminance: 200 },
          background: { r: 0, g: 0, b: 0.2, a: null, hex: null },
          layers: [
            { kind: "feed", x: 0, y: 0, width: 1, height: 1, camera, pixels },
          ],
        },
      },
      {
        time: 0.5,
        graphic: {
          emission: { kind: "emissive", luminance: 200 },
          background: null,
          layers: [],
        },
      },
    ],
  });
  const object: ReturnType<typeof buildModel> = buildModel(laptop);
  const mounted: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): ReturnType<typeof buildModel> => object,
  );
  const graphics: IAutoMovieSurfaceGraphicsObject =
    await prepareAutoMovieSurfaceGraphics({
      shot: { surfaceGraphics: [feed("cctv", 120)], duration: 1 },
      scene,
      models: [laptop],
      resolveNode: (): ReturnType<typeof buildModel> => object,
    });
  graphics.apply(0);
  const mesh: THREE.Mesh = object.object.getObjectByName(
    "surface-graphic:desk-laptop/screen",
  )!.children[0]!.children[0]!.children[1] as THREE.Mesh;
  const material: THREE.MeshBasicMaterial =
    mesh.material as THREE.MeshBasicMaterial;
  const map: THREE.Texture = material.map!;

  // 1. The target's size.
  const width: number = Math.round((120 * screen.width!) / screen.depth!);
  const targetOf: (texture: THREE.Texture) => {
    width: number;
    height: number;
  } = (texture: THREE.Texture): { width: number; height: number } =>
    texture.image as { width: number; height: number };
  TestValidator.equals(
    "feed target size",
    [targetOf(map).width, targetOf(map).height],
    [Math.max(1, width), 120],
  );

  // 2. One draw from cctv, as background inside the feed, then restored.
  const cctv: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(60, 1);
  const previous: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget(1, 1);
  let bound: THREE.WebGLRenderTarget | null = previous;
  const draws: {
    target: THREE.WebGLRenderTarget | null;
    camera: THREE.Camera;
    material: THREE.Material | THREE.Material[];
  }[] = [];
  const renderer: IAutoMovieFilmResponseRenderer = {
    getRenderTarget: (): THREE.WebGLRenderTarget | null => bound,
    setRenderTarget: (target: THREE.WebGLRenderTarget | null): void => {
      bound = target;
    },
    render: (_scene: THREE.Object3D, camera: THREE.Camera): void => {
      draws.push({ target: bound, camera, material: mesh.material });
    },
    toneMapping: THREE.NoToneMapping,
    toneMappingExposure: 1,
    autoClear: true,
    shadowMap: { autoUpdate: true, enabled: false },
  };
  graphics.renderFeeds(renderer, mounted.scene, (id: string) =>
    id === "cctv" ? cctv : undefined,
  );
  TestValidator.predicate(
    "one draw from cctv into the feed target, the feed shown as background",
    draws.length === 1 &&
      draws[0]!.camera === cctv &&
      draws[0]!.target?.texture === map &&
      draws[0]!.material !== material,
  );
  TestValidator.predicate(
    "material and render target restored",
    mesh.material === material && bound === previous && cctv.aspect === 1,
  );

  // 3. A hidden key draws nothing.
  graphics.apply(0.6);
  graphics.renderFeeds(renderer, mounted.scene, (): THREE.Camera => cctv);
  TestValidator.equals(
    "no draw while the feed's key is not in force",
    draws.length,
    1,
  );

  // 4. Refusals at the structural gate.
  const shot: (track: IAutoMovieSurfaceGraphicTrack) => IAutoMovieShot = (
    track: IAutoMovieSurfaceGraphicTrack,
  ): IAutoMovieShot => ({
    id: "call",
    name: null,
    scene: scene.id,
    camera: "film",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    surfaceGraphics: [track],
    duration: 1,
  });
  for (const [title, track, text] of [
    ["the shot's own camera", feed("film", 120), "shot's own camera"],
    ["an unknown camera", feed("ghost", 120), "camera the scene stages"],
    ["zero pixels", feed("cctv", 0), "pixels"],
    ["too many pixels", feed("cctv", 2049), "pixels"],
  ] as const) {
    const result: IAutoMovieValidation = validateShotArtifact(
      shot(track),
      scene,
      null,
    );
    TestValidator.predicate(
      `${title} is refused`,
      result.success === false &&
        result.violations.some(
          (violation: IAutoMovieConstraintViolation): boolean =>
            violation.path.endsWith("layers[0].camera") ||
            violation.path.endsWith("layers[0].pixels")
              ? violation.expected.includes(text)
              : false,
        ),
    );
  }

  // 5. Under the film's optics the feed is drawn through a response stage and
  // its material decodes the display picture; without them it reads linear.
  const encodedFlag: () => unknown = (): unknown => {
    const shader: {
      uniforms: Record<string, { value: unknown }>;
      fragmentShader: string;
    } = {
      uniforms: {},
      fragmentShader: "#include <common>\n#include <map_fragment>",
    };
    for (const patch of material.userData.shaderPatches as {
      key: string;
      apply: (target: typeof shader) => void;
    }[])
      if (patch.key === "automovie-surface-feed-decode") patch.apply(shader);
    return shader.uniforms.automovieFeedEncoded?.value;
  };
  graphics.apply(0);
  const film: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  const optics: IAutoMovieFilmOptics = { ev100: 6, toneMapping: "none" };
  graphics.renderFeeds(film.renderer, mounted.scene, (): THREE.Camera => cctv, {
    optics,
    seconds: 0.25,
  });
  const sceneDraw: createFilmResponseRendererDouble.IRender | undefined =
    film.renders.find(
      (entry: createFilmResponseRendererDouble.IRender): boolean =>
        entry.object === mounted.scene,
    );
  const finalDraw: createFilmResponseRendererDouble.IRender | undefined =
    film.renders.at(-1);
  TestValidator.predicate(
    "the feed's scene draws linear into a stage target, the response into the feed target",
    sceneDraw !== undefined &&
      sceneDraw.target !== null &&
      sceneDraw.target.texture !== map &&
      sceneDraw.exposure === 1 &&
      finalDraw !== undefined &&
      finalDraw.program !== null &&
      finalDraw.target?.texture === map &&
      film.renderer.getRenderTarget() === null,
  );
  TestValidator.equals(
    "the feed decodes the display picture",
    encodedFlag(),
    1,
  );
  graphics.renderFeeds(renderer, mounted.scene, (): THREE.Camera => cctv);
  TestValidator.equals("a plain feed reads linear light", encodedFlag(), 0);

  // 6. Disposal.
  let disposed: boolean = false;
  const fed: THREE.WebGLRenderTarget | null | undefined = draws[0]?.target;
  if (fed === null || fed === undefined)
    throw new Error("Expected the feed target");
  fed.addEventListener("dispose", (): void => {
    disposed = true;
  });
  graphics.dispose();
  TestValidator.predicate("the feed target is released", disposed);
}
