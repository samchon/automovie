import { createLaptop } from "@automovie/archetypes";
import {
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

import { renderFixtureIdentity } from "../internal/renderFixtureIdentity";
import { renderFixtureNode } from "../internal/renderFixtureNode";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the feed layers, the expected targets, bytes and passes, and the rows.
 * @evidence contracts/development/testing.md#behavioral-verification Measures the subject through the public feed measure and the public inventory and compares the inventory with and without the feeds.
 * @evidence contracts/development/testing.md#independent-expectations Target widths are the screen affordance's aspect times each box's, from the laptop's own extents; 8 bytes per pixel is an RGBA8 colour texture plus a 32-bit depth word; the pass count is the larger key's feed count.
 * @evidence contracts/development/testing.md#distinguishing-cases An inventory that ignores feeds, counts only one key's targets, or adds a pass per target instead of per shown feed gives other totals.
 * @evidence contracts/development/testing.md#execution-ownership A CPU-only measurement over an in-memory subject; no renderer.
 */
export function test_render_budget_feed_targets(): void {
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
  const layer = (
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
  const width = (box: number, pixels: number): number =>
    Math.max(1, Math.round(pixels * box * aspect));
  const bytes: number = (width(1, 120) * 120 + 2 * width(0.5, 64) * 64) * 8;
  const feeds: measureAutoMovieRenderFeeds.IResult =
    measureAutoMovieRenderFeeds(withFeeds);
  TestValidator.equals(
    "three targets, their bytes and two passes",
    [feeds.targets, feeds.bytes, feeds.passes],
    [3, bytes, 2],
  );

  // 2. The inventory totals.
  const measure = (
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
  TestValidator.equals(
    "the totals grow by the feeds",
    [
      after.totals.textures === null || before.totals.textures === null
        ? null
        : after.totals.textures - before.totals.textures,
      after.totals.textureBytes === null || before.totals.textureBytes === null
        ? null
        : after.totals.textureBytes - before.totals.textureBytes,
      (after.totals.drawCalls ?? NaN) - (before.totals.drawCalls ?? NaN),
    ],
    [3, bytes, 2 * sceneDraws],
  );

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
}
