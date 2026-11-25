import type {
  IAutoMovieFont,
  IAutoMovieSurfaceGraphic,
  IAutoMovieSurfaceGraphicLayer,
} from "@automovie/interface";
import {
  buildAutoMovieSurfaceGraphicKey,
  createAutoMovieSystemTextTexture,
} from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";

/** The 2D context the system-font texture draws with, as the host offers it. */
class FakeContext {
  public font: string = "";
  public textBaseline: string = "";
  public direction: string = "";
  public textAlign: string = "";
  public fillStyle: string = "";
  public globalCompositeOperation: string = "";

  /** Ten pixels per character, ascent 8 and descent 2. */
  public measureText(text: string): {
    width: number;
    fontBoundingBoxAscent: number;
    fontBoundingBoxDescent: number;
    actualBoundingBoxAscent: number;
    actualBoundingBoxDescent: number;
  } {
    return {
      width: text.length * 10,
      fontBoundingBoxAscent: 8,
      fontBoundingBoxDescent: 2,
      actualBoundingBoxAscent: 8,
      actualBoundingBoxDescent: 2,
    };
  }

  public scale(): void {}
  public fillText(): void {}
  public resetTransform(): void {}
  public fillRect(): void {}
}

/** A canvas with the size it was made with and one shared fake context. */
class FakeCanvas {
  public constructor(
    public readonly width: number,
    public readonly height: number,
  ) {}

  public getContext(): FakeContext {
    return new FakeContext();
  }
}

/** Run a body while the host offers the fake canvas, then take it away. */
const withCanvas: (body: () => void) => void = (body: () => void): void => {
  Object.defineProperty(globalThis, "OffscreenCanvas", {
    value: FakeCanvas,
    configurable: true,
  });
  try {
    body();
  } finally {
    Reflect.deleteProperty(globalThis, "OffscreenCanvas");
  }
};

const text: (
  font: string | undefined,
) => IAutoMovieSurfaceGraphicLayer.IText = (
  font: string | undefined,
): IAutoMovieSurfaceGraphicLayer.IText => ({
  kind: "text",
  ...(font === undefined ? {} : { font }),
  text: "Hi",
  x: 0,
  y: 0,
  width: 0.5,
  height: 0.5,
  size: 0.125,
  color: { r: 1, g: 1, b: 1, a: null, hex: null },
});

/**
 * An unnamed text layer is drawn with a system-font coverage texture and a
 * named one asks for its decoded font.
 *
 * Scenarios:
 *
 * 1. A 2 by 1 metre face, a box half its width and height and an em of 0.125
 *    of the depth: the canvas is 96 / 0.125 = 768 by 384 pixels.
 * 2. A zero-width box is refused, and so is a host without a canvas.
 * 3. The key builder never asks for a font for an unnamed layer, takes the
 *    texture, the quad's geometry and material and the seal's material into
 *    `owned`, and two builds of equal input agree in layer count, render order
 *    and ownership.
 * 4. A named layer asks for its font by id, so a font the shot does not list
 *    refuses.
 */
export function test_unit_render_scene_build_surface_graphic_key_system_font(): void {
  withCanvas((): void => {
    const texture: THREE.CanvasTexture<OffscreenCanvas> =
      createAutoMovieSystemTextTexture(2, 1, text(undefined));
    TestValidator.equals("canvas size", [texture.image.width, texture.image.height], [
      768, 384,
    ]);
    TestValidator.equals("first row on top", texture.flipY, false);
    TestValidator.error("zero-width box", (): void => {
      createAutoMovieSystemTextTexture(2, 1, { ...text(undefined), width: 0 });
    });

    const asked: string[] = [];
    const graphic: IAutoMovieSurfaceGraphic = {
      emission: { kind: "printed" },
      background: null,
      layers: [text(undefined)],
    };
    const build = (): { orders: number[]; owned: number } => {
      const owned: { dispose(): void }[] = [];
      const group: THREE.Group = buildAutoMovieSurfaceGraphicKey({
        graphic,
        width: 2,
        depth: 1,
        image: (): THREE.Texture => {
          throw new Error("no image layer");
        },
        font: (id: string): IAutoMovieFont => {
          asked.push(id);
          throw new Error(`font ${id}`);
        },
        feed: (): THREE.Texture => {
          throw new Error("no feed layer");
        },
        owned,
      });
      return {
        orders: group.children.map(
          (child: THREE.Object3D): number => child.renderOrder,
        ),
        owned: owned.length,
      };
    };
    const first: { orders: number[]; owned: number } = build();
    TestValidator.equals("equal input is stable", build(), first);
    TestValidator.equals("face, text and seal", first.orders, [
      -1_000_000, -999_999, -999_998,
    ]);
    TestValidator.equals("owned resources", first.owned, 6);
    TestValidator.equals("no font asked", asked, []);

    TestValidator.error("named font is asked for", (): void => {
      buildAutoMovieSurfaceGraphicKey({
        graphic: { ...graphic, layers: [text("serif")] },
        width: 2,
        depth: 1,
        image: (): THREE.Texture => {
          throw new Error("no image layer");
        },
        font: (id: string): IAutoMovieFont => {
          asked.push(id);
          throw new Error(`font ${id}`);
        },
        feed: (): THREE.Texture => {
          throw new Error("no feed layer");
        },
        owned: [],
      });
    });
    TestValidator.equals("the named id", asked, ["serif"]);
  });

  TestValidator.error("host without a canvas", (): void => {
    createAutoMovieSystemTextTexture(2, 1, text(undefined));
  });
}
