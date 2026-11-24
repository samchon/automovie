import {
  deriveAutoMovieSemanticMask,
  measureAutoMovieRenderInventory,
} from "@automovie/engine";
import type {
  IAutoMovieFilmOptics,
  IAutoMovieFilmShading,
  IAutoMovieRenderInventory,
  IAutoMovieRenderOwnerCost,
  IAutoMovieRenderSubject,
  IAutoMovieRenderTargetSettings,
  IAutoMovieScene,
} from "@automovie/interface";
import {
  AutoMovieFilmIndirectStage,
  AutoMovieFilmResponseStage,
  applySceneMedium,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "../draw/createFilmResponseRendererDouble";
import { createProbeRendererDouble } from "../draw/createProbeRendererDouble";
import { boxModel } from "../../../internal/boxModel";
import { renderFixtureNode } from "../../../internal/renderFixtureNode";

/**
 * The render inventory counts every GPU target a directly rendered film's stage
 * allocates, at the beauty pass's drawing buffer, and every further pass it
 * draws.
 *
 * The film is delivered at 1920 × 1080, so the draw host's beauty pass draws
 * into a 3840 × 2160 drawing buffer, twice each side. Its optics set a shutter
 * with 16 samples; its shading asks for occlusion and a 5 × 3 × 5 probe grid;
 * its scene carries a medium.
 *
 * Scenarios:
 *
 * 1. Against the same subject without a film, the inventory's texture total grows
 *    by every target the render stages allocate when they draw that film: the
 *    linear target and its depth texture, the glare pyramid and kernel pairs,
 *    the medium's march target, the two sample sums, the three occlusion
 *    targets and their depth texture, the probe bake target and the baked
 *    grid's texture; and its byte total by their bytes, eight per half-float
 *    texel, sixteen per float texel and four per depth texel.
 * 2. The draw and triangle totals grow by the further passes: 15 more beauty scene
 *    passes for 16 samples, 16 occlusion prepasses, 12 bake passes for each of
 *    the 75 probes, and 82 full-frame quads (the final pass, 16 accumulation
 *    quads and the average, two occlusion quads and two medium quads per
 *    sample), each of two triangles.
 * 3. The rows name the five `render-pass:film-*` owners, each with texture and
 *    byte rows marked `runtime` and draw and triangle rows marked `pass`.
 * 4. Without target settings the raster is unknown, so both texture totals are
 *    null and each has a `not-run` gap.
 */
export function test_unit_render_scene_budget_film_targets(): void {
  const width: number = 3840;
  const height: number = 2160;
  const optics: IAutoMovieFilmOptics = {
    ev100: 8,
    toneMapping: "acesFilmic",
    shutter: { angle: 180 },
    samples: 16,
  };
  const shading: IAutoMovieFilmShading = {
    occlusion: { radius: 0.5 },
    probes: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 4, y: 2, z: 4 },
      spacing: 1,
      layer: 1,
      revision: "set",
    },
  };
  const scene: IAutoMovieScene = {
    id: "room",
    name: null,
    nodes: [renderFixtureNode("crate", "crate-model")],
    cameras: [],
    lights: [],
    medium: { scattering: 0.05, absorption: 0, anisotropy: 0.3 },
  } as IAutoMovieScene;
  const settings: IAutoMovieRenderTargetSettings = {
    width,
    height,
    pixelRatio: 1,
    shadows: false,
    shadowType: "none",
    toneMapping: "acesFilmic",
    exposure: 1,
  };
  const plain: IAutoMovieRenderSubject = {
    scene,
    models: [boxModel({ id: "crate-model" })],
  };
  const filmed: IAutoMovieRenderSubject = {
    ...plain,
    film: { optics, shading },
  };
  const measure: (
    subject: IAutoMovieRenderSubject,
    withSettings: boolean,
  ) => IAutoMovieRenderInventory = (
    subject: IAutoMovieRenderSubject,
    withSettings: boolean,
  ): IAutoMovieRenderInventory =>
    measureAutoMovieRenderInventory({
      subject,
      mask: deriveAutoMovieSemanticMask(subject),
      ...(withSettings ? { settings } : {}),
    });

  // The targets the render stages draw into for this film.
  const targets: Set<THREE.WebGLRenderTarget> = new Set();
  const collect: (
    renders: readonly createFilmResponseRendererDouble.IRender[],
  ) => void = (
    renders: readonly createFilmResponseRendererDouble.IRender[],
  ): void => {
    for (const render of renders)
      if (render.target !== null) targets.add(render.target);
  };
  const three: THREE.Scene = new THREE.Scene();
  applySceneMedium(three, scene.medium);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  const response: AutoMovieFilmResponseStage = new AutoMovieFilmResponseStage();
  const drawn: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  // Glare makes the response draw into every pyramid level and kernel target
  // it allocates, which it allocates with any optics.
  response.draw({
    renderer: drawn.renderer,
    scene: three,
    camera,
    optics: { ev100: 8, toneMapping: "acesFilmic", glare: { strength: 0.1 } },
    seconds: 0,
    width,
    height,
  });
  for (let index: number = 0; index < 2; ++index)
    response.accumulate({
      renderer: drawn.renderer,
      scene: three,
      camera,
      optics,
      seconds: 0,
      width,
      height,
      index,
      count: 2,
    });
  collect(drawn.renders);
  const indirect: AutoMovieFilmIndirectStage = new AutoMovieFilmIndirectStage();
  const shaded: createProbeRendererDouble.IDouble = createProbeRendererDouble({
    texel: (): number => 0,
  });
  indirect.draw(
    {
      renderer: shaded.renderer,
      scene: three,
      camera,
      shading,
      optics: true,
      seconds: 0,
      width,
      height,
      sample: 0,
    },
    (): void => {},
  );
  collect(shaded.renders);
  const texel: (target: THREE.WebGLRenderTarget) => number = (
    target: THREE.WebGLRenderTarget,
  ): number =>
    (target.texture.type === THREE.FloatType ? 16 : 8) +
    (target.depthBuffer ? 4 : 0);
  let expectedTargets: number = 1;
  let expectedBytes: number = 9 * (5 * 3 * 5) * 16;
  for (const target of targets) {
    expectedTargets += 1 + (target.depthTexture === null ? 0 : 1);
    expectedBytes += target.width * target.height * texel(target);
  }
  response.dispose();
  indirect.dispose();

  // 1. The totals grow by the stages' targets.
  const before: IAutoMovieRenderInventory = measure(plain, true);
  const after: IAutoMovieRenderInventory = measure(filmed, true);

  // 2. The passes. Without a shadow caster a scene pass is the opaque frame,
  // half the plain frame's draws beside its outline pass.
  const sceneDraws: number = (before.totals.drawCalls ?? NaN) / 2;
  const sceneTriangles: number = (before.totals.triangles ?? NaN) / 2;
  const scenes: number = 15 + 16 + 12 * 75;
  const quads: number = 1 + 17 + 2 * 16 + 2 * 16;

  // 3. The owners.
  const order: (left: string, right: string) => number = (
    left: string,
    right: string,
  ): number => (left < right ? -1 : left > right ? 1 : 0);
  TestValidator.equals(
    "five film owners with their texture rows and pass rows",
    after.owners
      .filter((row: IAutoMovieRenderOwnerCost): boolean =>
        row.owner.startsWith("render-pass:film-"),
      )
      .map(
        (row: IAutoMovieRenderOwnerCost): string =>
          `${row.owner}:${row.metric}:${row.kind}`,
      )
      .sort(order),
    ["medium", "occlusion", "probes", "response", "samples"]
      .flatMap((stage: string): string[] => [
        `render-pass:film-${stage}:drawCalls:pass`,
        `render-pass:film-${stage}:textureBytes:runtime`,
        `render-pass:film-${stage}:textures:runtime`,
        `render-pass:film-${stage}:triangles:pass`,
      ])
      .sort(order),
  );

  // 4. No settings.
  const unsized: IAutoMovieRenderInventory = measure(filmed, false);
  TestValidator.predicate(
    "without settings both texture totals are gaps",
    unsized.totals.textures === null &&
      unsized.totals.textureBytes === null &&
      ["textures", "textureBytes"].every((metric: string): boolean =>
        unsized.gaps.some(
          (gap: IAutoMovieRenderInventory["gaps"][number]): boolean =>
            gap.metric === metric && gap.status === "not-run",
        ),
      ),
  );
}
