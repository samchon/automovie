import { createLaptop } from "@automovie/archetypes";
import {
  AUTOMOVIE_FILM_GLARE_KERNELS,
  deriveAutoMovieSemanticMask,
  measureAutoMovieRenderFeeds,
  measureAutoMovieRenderInventory,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModel,
  IAutoMovieRenderInventory,
  IAutoMovieRenderOwnerCost,
  IAutoMovieRenderSubject,
  IAutoMovieScene,
  IAutoMovieSurfaceGraphicLayer,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { renderFixtureIdentity } from "../../../internal/renderFixtureIdentity";
import { renderFixtureNode } from "../../../internal/renderFixtureNode";

/**
 * A surface graphic's feed layers count in the render inventory: each feed
 * render target as a texture with its bytes, and each feed shown at once as one
 * more scene pass.
 *
 * Scenarios:
 *
 * 1. A laptop screen whose first key holds one feed of 120 pixels and whose second
 *    holds two of 64 pixels holds three render targets, each as wide as its
 *    box's aspect on the screen, at 8 bytes per pixel, and shows at most two
 *    feeds at once.
 * 2. The inventory's texture and byte totals grow by those targets and bytes, and
 *    its draw calls by two scene passes, against the same subject without
 *    surface graphics.
 * 3. The screen's mask owner carries the rows, the passes marked `pass`.
 * 4. With a directly rendered film's optics, each feed also holds the film
 *    response stage the film target measure gives at the feed's own raster.
 */
export function test_unit_render_scene_budget_feed_targets(): void {
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
  const layer: (
    x: number,
    width: number,
    pixels: number,
  ) => IAutoMovieSurfaceGraphicLayer.IFeed = (
    x: number,
    width: number,
    pixels: number,
  ): IAutoMovieSurfaceGraphicLayer.IFeed => ({
    kind: "feed",
    x,
    y: 0,
    width,
    height: 1,
    camera: "cctv",
    pixels,
  });
  const track: IAutoMovieSurfaceGraphicTrack = {
    node: "desk-laptop",
    surface: "screen",
    keys: [
      {
        time: 0,
        graphic: {
          emission: { kind: "emissive", luminance: 200 },
          background: null,
          layers: [layer(0, 1, 120)],
        },
      },
      {
        time: 0.5,
        graphic: {
          emission: { kind: "emissive", luminance: 200 },
          background: null,
          layers: [layer(0, 0.5, 64), layer(0.5, 0.5, 64)],
        },
      },
    ],
  };
  const plain: IAutoMovieRenderSubject = {
    scene,
    models: [laptop],
    textureResidency: undefined,
  } as IAutoMovieRenderSubject;
  const withFeeds: IAutoMovieRenderSubject = {
    ...plain,
    surfaceGraphics: [track],
  };

  // 1. The feed measure.
  const aspect: number = screen.width! / screen.depth!;
  const width: (box: number, pixels: number) => number = (
    box: number,
    pixels: number,
  ): number => Math.max(1, Math.round(pixels * box * aspect));
  const bytes: number = (width(1, 120) * 120 + 2 * width(0.5, 64) * 64) * 8;
  const feeds: measureAutoMovieRenderFeeds.IResult =
    measureAutoMovieRenderFeeds(withFeeds);
  TestValidator.equals(
    "three targets, their bytes and two passes",
    [feeds.targets, feeds.bytes, feeds.passes],
    [3, bytes, 2],
  );

  // 2. The inventory totals.
  const measure: (
    subject: IAutoMovieRenderSubject,
  ) => IAutoMovieRenderInventory = (
    subject: IAutoMovieRenderSubject,
  ): IAutoMovieRenderInventory =>
    measureAutoMovieRenderInventory({
      subject,
      mask: deriveAutoMovieSemanticMask(subject),
    });
  const before: IAutoMovieRenderInventory = measure(plain);
  const after: IAutoMovieRenderInventory = measure(withFeeds);

  // Without a shadow caster the frame is the opaque pass and the outline pass,
  // so one scene pass is half the plain frame's draw calls.
  const sceneDraws: number = (before.totals.drawCalls ?? NaN) / 2;

  // 3. The screen's rows.
  const rows: IAutoMovieRenderOwnerCost[] = after.owners.filter(
    (row: IAutoMovieRenderOwnerCost): boolean =>
      row.owner === "surface-graphic:desk-laptop/screen",
  );
  TestValidator.equals(
    "the screen owns its feed rows",
    rows
      .map(
        (row: IAutoMovieRenderOwnerCost): string => `${row.metric}:${row.kind}`,
      )
      .sort((left: string, right: string): number =>
        left < right ? -1 : left > right ? 1 : 0,
      ),
    [
      "drawCalls:pass",
      "textureBytes:runtime",
      "textures:runtime",
      "triangles:pass",
    ],
  );

  // 4. Under a film's optics each feed also holds its own response stage.
  const film: IAutoMovieRenderSubject["film"] = {
    optics: { ev100: 6, toneMapping: "none" },
  };
  // The stage's documented allocation at a raster: the linear half-float
  // frame (8 bytes a texel) and its 32-bit depth texture, one half-float
  // pyramid level per halving down to the deepest kernel's level
  // max(0, floor(log2(sigma * height / 2))), and two half-float blur targets
  // per kernel at its level, each side rounded up.
  const stageAt: (
    stageWidth: number,
    stageHeight: number,
  ) => { targets: number; bytes: number } = (
    stageWidth: number,
    stageHeight: number,
  ): { targets: number; bytes: number } => {
    const at: (level: number) => number = (level: number): number =>
      Math.ceil(stageWidth / 2 ** level) * Math.ceil(stageHeight / 2 ** level);
    const levels: number[] = AUTOMOVIE_FILM_GLARE_KERNELS.map(
      (kernel: { sigma: number }): number =>
        Math.max(0, Math.floor(Math.log2((kernel.sigma * stageHeight) / 2))),
    );
    const deepest: number = Math.max(...levels);
    let bytes: number = stageWidth * stageHeight * (8 + 4);
    for (let level: number = 1; level <= deepest; ++level)
      bytes += at(level) * 8;
    for (const level of levels) bytes += 2 * at(level) * 8;
    return { targets: 2 + deepest + 2 * levels.length, bytes };
  };
  const large: { targets: number; bytes: number } = stageAt(width(1, 120), 120);
  const small: { targets: number; bytes: number } = stageAt(width(0.5, 64), 64);
  const filmed: measureAutoMovieRenderFeeds.IResult =
    measureAutoMovieRenderFeeds({ ...withFeeds, film });
  TestValidator.equals(
    "each feed adds the response stage the film measures at its raster",
    [filmed.targets, filmed.bytes, filmed.passes],
    [
      3 + large.targets + 2 * small.targets,
      bytes + large.bytes + 2 * small.bytes,
      2,
    ],
  );
}
