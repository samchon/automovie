import { createSignPost } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieFontSource,
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import {
  type IAutoMovieSurfaceGraphicsObject,
  buildModel,
  buildScene,
  prepareAutoMovieSurfaceGraphics,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import * as THREE from "three";

import { renderFixtureNode } from "../internal/renderFixtureNode";
import { syntheticTrueTypeFont } from "../internal/syntheticTrueTypeFont";

/**
 * Flat lettering on a sign's face reads the right way round, and a shot whose
 * font cannot be decoded is refused before any frame is drawn.
 *
 * Scenarios:
 *
 * 1. "LO" set from the synthetic font on the STOP sign's `face`, seen from the
 *    front (world +Z, the face normal), puts every `L` vertex left of every `O`
 *    vertex, with the `L` in units 100 to 500 and the `O` from 600 on, so the
 *    text is not mirrored.
 * 2. The `L`'s highest vertex is on its stem (x at most 200 units) and its
 *    rightmost vertex is on its foot (within 100 units of its lowest point), so
 *    the text is not flipped.
 * 3. Preparing the shot twice gives identical glyph position buffers.
 * 4. A shot listing an embedded source whose bytes carry the CFF `OTTO` signature,
 *    with a correct digest, is refused while preparing, with the decoder's
 *    diagnostic, and mounts nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the sign, the text, the front view and each orientation, determinism and refusal fact the test pins.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares the graphics through the public preparer over a mounted sign and reads the world positions of the glyph mesh it builds, and the rejection of a refused font.
 * @evidence contracts/development/testing.md#independent-expectations The glyph extents come from the synthetic font's own contour coordinates (L from x 100 to 500 with its foot under y 100, O from 50 to 650 placed at 600 − 50 = 550 units), scaled by the em size, and the sign's reading frame from IAutoMovieAffordance.
 * @evidence contracts/development/testing.md#distinguishing-cases A mirrored layout fails scenario 1, a flipped one scenario 2; the refused font fails scenario 4. Layout and glyph refusals are owned by test_engine_text_layout and test_engine_glyph_geometry.
 * @evidence contracts/development/testing.md#execution-ownership In-memory Three scene graph and in-memory font bytes; no renderer.
 */
export async function test_render_surface_text(): Promise<void> {
  const sign: IAutoMovieModel = createSignPost({ id: "stop" });
  const face: IAutoMovieAffordance = sign.affordances!.find(
    (entry: IAutoMovieAffordance): boolean => entry.id === "face",
  )!;
  const bytes: Uint8Array = syntheticTrueTypeFont();
  const source: (data: Uint8Array) => IAutoMovieFontSource = (
    data: Uint8Array,
  ): IAutoMovieFontSource => ({
    kind: "embedded",
    id: "block",
    data: Buffer.from(data).toString("base64"),
    digest: `sha256:${createHash("sha256").update(data).digest("hex")}`,
    origin:
      "test/src/features/internal/syntheticTrueTypeFont.ts#syntheticTrueTypeFont",
  });
  const scene: IAutoMovieScene = {
    id: "corner",
    name: null,
    nodes: [renderFixtureNode("stop-sign", sign.id)],
    cameras: [],
    lights: [],
  };
  const size: number = 0.2;
  const tracks: IAutoMovieSurfaceGraphicTrack[] = [
    {
      node: "stop-sign",
      surface: "face",
      keys: [
        {
          time: 0,
          graphic: {
            emission: { kind: "printed" },
            background: null,
            layers: [
              {
                kind: "text",
                // The middle band, along the octagon's left flat, so the
                // face's outline cuts no glyph.
                x: 0,
                y: 0.4,
                width: 1,
                height: 0.6,
                font: "block",
                text: "LO",
                size,
                color: { r: 1, g: 1, b: 1, a: null, hex: null },
              },
            ],
          },
        },
      ],
    },
  ];
  const prepare: (
    fonts: IAutoMovieFontSource[],
  ) => Promise<{
    graphics: IAutoMovieSurfaceGraphicsObject;
    mounted: ReturnType<typeof buildScene>;
  }> = async (
    fonts: IAutoMovieFontSource[],
  ): Promise<{
    graphics: IAutoMovieSurfaceGraphicsObject;
    mounted: ReturnType<typeof buildScene>;
  }> => {
    const object: ReturnType<typeof buildModel> = buildModel(sign);
    const mounted: ReturnType<typeof buildScene> = buildScene(
      scene,
      (): ReturnType<typeof buildModel> => object,
    );
    const graphics: IAutoMovieSurfaceGraphicsObject =
      await prepareAutoMovieSurfaceGraphics({
        shot: { surfaceGraphics: tracks, duration: 1, fonts },
        scene,
        models: [sign],
        resolveNode: (): ReturnType<typeof buildModel> => object,
      });
    graphics.apply(0);
    mounted.scene.updateMatrixWorld(true);
    return { graphics, mounted };
  };
  const glyphs: (mounted: ReturnType<typeof buildScene>) => THREE.Mesh = (
    mounted: ReturnType<typeof buildScene>,
  ): THREE.Mesh =>
    mounted.scene.getObjectByName("surface-graphic:stop-sign/face")!
      .children[0]!.children[0]!.children[1] as THREE.Mesh;

  // 1 and 2. Front view: world +X is the reader's right, world +Y the top.
  const first: Awaited<ReturnType<typeof prepare>> = await prepare([
    source(bytes),
  ]);
  const mesh: THREE.Mesh = glyphs(first.mounted);
  const scale: number = (size * face.depth!) / 1000;
  const left: number = face.frame.translation.x - face.width! / 2;
  const position: THREE.BufferAttribute = mesh.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const points: { u: number; y: number }[] = [];
  for (let i: number = 0; i < position.count; ++i) {
    const world: THREE.Vector3 = new THREE.Vector3()
      .fromBufferAttribute(position, i)
      .applyMatrix4(mesh.matrixWorld);
    points.push({ u: (world.x - left) / scale, y: world.y / scale });
  }
  const ell: { u: number; y: number }[] = points.filter(
    (point: { u: number; y: number }): boolean => point.u < 550,
  );
  const oh: { u: number; y: number }[] = points.filter(
    (point: { u: number; y: number }): boolean => point.u >= 550,
  );
  const span: (values: number[]) => [number, number] = (
    values: number[],
  ): [number, number] => [Math.min(...values), Math.max(...values)];
  const [ellLeft, ellRight]: [number, number] = span(
    ell.map((point: { u: number; y: number }): number => point.u),
  );
  const [ohLeft]: [number, number] = span(
    oh.map((point: { u: number; y: number }): number => point.u),
  );
  TestValidator.predicate(
    "L lies left of O, in its own units",
    ell.length > 0 &&
      oh.length > 0 &&
      Math.abs(ellLeft - 100) < 1e-3 &&
      Math.abs(ellRight - 500) < 1e-3 &&
      Math.abs(ohLeft - 600) < 1e-3,
  );
  const ellBottom: number = Math.min(
    ...ell.map((point: { u: number; y: number }): number => point.y),
  );
  const top: { u: number; y: number } = ell.reduce(
    (best: { u: number; y: number }, point: { u: number; y: number }) =>
      point.y > best.y ? point : best,
  );
  const rightmost: { u: number; y: number } = ell.reduce(
    (best: { u: number; y: number }, point: { u: number; y: number }) =>
      point.u > best.u ? point : best,
  );
  TestValidator.predicate(
    "the L's stem is at its top and its foot at its bottom",
    top.u <= 200 + 1e-3 && rightmost.y <= ellBottom + 100 + 1e-3,
  );

  // 3. Determinism.
  const second: Awaited<ReturnType<typeof prepare>> = await prepare([
    source(bytes),
  ]);
  TestValidator.equals(
    "identical glyph buffers",
    Array.from(glyphs(second.mounted).geometry.getAttribute("position").array),
    Array.from(position.array),
  );
  first.graphics.dispose();
  second.graphics.dispose();

  // 4. A font the decoder refuses refuses the shot before any frame.
  const cff: Uint8Array = bytes.slice();
  cff.set([0x4f, 0x54, 0x54, 0x4f], 0);
  let message: string = "";
  try {
    await prepare([source(cff)]);
  } catch (error) {
    message = (error as Error).message;
  }
  TestValidator.predicate(
    "the refused font is named with the decoder's diagnostic",
    message.includes('Font source "block" cannot be decoded') &&
      message.includes("OTTO"),
  );
}
