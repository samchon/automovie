import {
  type Canvas,
  GlobalFonts,
  type Image,
  ImageData,
  type SKRSContext2D,
  createCanvas,
  loadImage,
} from "@napi-rs/canvas";
import path from "node:path";

import { repositoryRoot } from "../../features/internal/repositoryRoot";
import { NodeCanvasCamera } from "./NodeCanvasCamera";
import type { NodeCanvasTypes } from "./NodeCanvasTypes";

/**
 * Experimental CPU orthographic z-buffer followed by actual Skia Canvas2D PNG encoding.
 * Uses original display triangles only for rasterization; never generates or judges a shape.
 * Flat two-sided Lambert clay has no PBR, shadows, transparency or GPU/Three parity.
 * Original curves can explicitly use xray; depth curves use a 10 micrometre display bias.
 *
 * Annotation text is drawn in DejaVu Sans, shipped beside this file in `fonts/`
 * with its [upstream license](https://dejavu-fonts.github.io/License.html), and
 * registered once before the first draw, never in a system font such as Arial:
 * a runner without that font would draw no glyphs, so the same frame would differ between
 * machines and a diagnostic caption would vanish. The bundled face makes glyphs, and so
 * the annotated PNG bytes, deterministic across runners.
 */
export namespace NodeCanvasRaster {
  /** The family the bundled caption font is registered under. */
  const CAPTION: string = "AutoMovie Caption";

  /** Whether the bundled caption font has been registered with Skia in this process. */
  let registered: boolean = false;

  /** Register the bundled caption font once and return its family; a font that cannot be read stops the frame instead of drawing none. */
  function family(): string {
    if (!registered) {
      const file: string = path.join(
        repositoryRoot(),
        "test",
        "src",
        "reference-conics",
        "render",
        "fonts",
        "DejaVuSans.ttf",
      );
      if (GlobalFonts.registerFromPath(file, CAPTION) === null)
        throw new Error(`The caption font ${file} could not be registered`);
      registered = true;
    }
    return CAPTION;
  }

  /** Unlabelled raster state of immutable reference meshes, before any dynamic mesh or curve is drawn. */
  export interface IBackground {
    /** Original opaque lossless RGBA bytes in row-major viewport order. */
    pixels: Uint8ClampedArray;

    /** Exact maximum camera depth per pixel, including negative infinity for no surface. */
    depth: Float64Array;

    /** Original surface-write count, retained for unchanged frame statistics. */
    surface: number;
  }

  /** Run only the existing mesh raster pass; labels and generated overlays belong to each later render. */
  export function prepare(
    camera: NodeCanvasTypes.Camera,
    meshes: readonly NodeCanvasTypes.Mesh[],
  ): IBackground {
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(
      camera.width * camera.height * 4,
    );
    const depth: Float64Array = new Float64Array(
      camera.width * camera.height,
    ).fill(-Infinity);
    for (let offset: number = 0; offset < pixels.length; offset += 4)
      pixels.set([238, 241, 245, 255], offset);
    const statistics: { surface: number } = { surface: 0 };
    surfaces(camera, meshes, pixels, depth, statistics);
    return { pixels, depth, surface: statistics.surface };
  }

  /** Losslessly encode only the prepared background; request-specific captions are never cached. */
  export function encodeBackground(
    camera: NodeCanvasTypes.Camera,
    background: IBackground,
  ): Buffer {
    const canvas: Canvas = createCanvas(camera.width, camera.height);
    canvas
      .getContext("2d")
      .putImageData(
        new ImageData(background.pixels, camera.width, camera.height),
        0,
        0,
      );
    return canvas.toBuffer("image/png");
  }

  /** Decode an existing PNG with the same native Canvas backend, without resizing or drawing any geometry. */
  export async function decodePng(
    png: Uint8Array,
  ): Promise<{ width: number; height: number; pixels: Uint8ClampedArray }> {
    const image: Image = await loadImage(
      Buffer.from(png.buffer, png.byteOffset, png.byteLength),
    );
    const canvas: Canvas = createCanvas(image.width, image.height);
    const context: SKRSContext2D = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    return {
      width: image.width,
      height: image.height,
      pixels: context.getImageData(0, 0, image.width, image.height).data,
    };
  }

  /** Forces native Canvas initialization separately from source preparation and first rendering. */
  export function initialize(): { milliseconds: number; backend: string } {
    const started: number = performance.now();
    const canvas: Canvas = createCanvas(2, 2);
    canvas.getContext("2d").fillRect(0, 0, 1, 1);
    return {
      milliseconds: performance.now() - started,
      backend: "@napi-rs/canvas 1.0.1 / Skia Canvas2D, CPU z-buffer, no GPU",
    };
  }

  /**
   * Render one diagnostic frame with actual depth and an explicit subject header.
   * The seventh subject argument defaults to f1; the existing sixth background argument keeps its meaning.
   * The eighth observation argument separates the displayed stage from run evidence; omission keeps a neutral diagnostic caption.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing CPU triangle depth, curve line modes, flat clay and Skia encoding consume the supplied metre scene and complete camera; subject and caller-reported observation affect only annotation text, with null diagnostic count remaining unknown.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Optional background, scene drawing, explicit stage/run annotation and PNG encoding retain their existing order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No geometry, colour, light or projection changes; the former unconditional not-run assertion is removed rather than inferring realization from displayed meshes or promoting mesh presence to success.
   * @evidence contracts/development/implementation.md#efficient-algorithms Raster work scales with projected triangles, line samples and image pixels; subject text adds no scene traversal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Callers supply evaluated scene/camera data; the optional existing background retains its unchanged reuse role.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned PNG and scalar timing/pixel data; per-frame Canvas/depth arrays leave scope and no subject cache exists.
   * @evidence contracts/development/common.md#meaningful-documentation States diagnostic backend scope, argument order, neutral omitted evidence and independent displayed/run state. Corrected headers intentionally change annotated PNG bytes.
   */
  export function render(
    camera: NodeCanvasTypes.Camera,
    meshes: readonly NodeCanvasTypes.Mesh[],
    curves: readonly NodeCanvasTypes.Curve[],
    lineMode: "xray" | "depth",
    label: string,
    background?: IBackground,
    subject: string = "f1",
    observation?: NodeCanvasTypes.Observation,
  ): {
    png: Buffer;
    milliseconds: { canvas: number; raster: number; encode: number };
    pixels: { surface: number; line: number; hiddenLine: number };
  } {
    const started: number = performance.now();
    if (
      background !== undefined &&
      (background.pixels.length !== camera.width * camera.height * 4 ||
        background.depth.length !== camera.width * camera.height)
    )
      throw new Error(
        "The reference raster state does not match the actual viewport",
      );
    const canvas: Canvas = createCanvas(camera.width, camera.height);
    const context: SKRSContext2D = canvas.getContext("2d");
    const initialized: number = performance.now();
    const pixels: Uint8ClampedArray =
      background === undefined
        ? new Uint8ClampedArray(camera.width * camera.height * 4)
        : new Uint8ClampedArray(background.pixels);
    const depth: Float64Array =
      background === undefined
        ? new Float64Array(camera.width * camera.height).fill(-Infinity)
        : new Float64Array(background.depth);
    if (background === undefined)
      for (let offset: number = 0; offset < pixels.length; offset += 4)
        pixels.set([238, 241, 245, 255], offset);
    const statistics: { surface: number; line: number; hiddenLine: number } = {
      surface: background?.surface ?? 0,
      line: 0,
      hiddenLine: 0,
    };
    surfaces(camera, meshes, pixels, depth, statistics);
    for (const curve of curves) {
      const hex: string = curve.colour ?? "b52653";
      const colour: NodeCanvasTypes.Point = [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
      const points: NodeCanvasTypes.Point[] = curve.points.map(
        (point: NodeCanvasTypes.Point): NodeCanvasTypes.Point =>
          NodeCanvasCamera.project(point, camera),
      );
      for (let i: number = 1; i < points.length + Number(curve.closed); i++) {
        const a: NodeCanvasTypes.Point = points[i - 1]!;
        const b: NodeCanvasTypes.Point = points[i % points.length]!;
        const steps: number = Math.ceil(
          Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])),
        );
        for (let step: number = 0; step <= steps; step++) {
          const t: number = steps === 0 ? 0 : step / steps;
          const x: number = Math.round(a[0] + t * (b[0] - a[0]));
          const y: number = Math.round(a[1] + t * (b[1] - a[1]));
          if (
            x < 0 ||
            x >= camera.width ||
            y < (camera.annotations === false ? 0 : 80) ||
            y >= camera.height - (camera.annotations === false ? 0 : 25)
          )
            continue;
          const index: number = y * camera.width + x;
          const viewDepth: number =
            (camera.clipping?.distance ?? 0) - (a[2] + t * (b[2] - a[2]));
          if (
            camera.clipping !== undefined &&
            (viewDepth < camera.clipping.near ||
              viewDepth > camera.clipping.far)
          )
            continue;
          if (
            lineMode === "depth" &&
            curve.xray !== true &&
            a[2] + t * (b[2] - a[2]) + 0.00001 < depth[index]!
          ) {
            statistics.hiddenLine++;
            continue;
          }
          pixels.set([...colour, 255], index * 4);
          statistics.line++;
        }
      }
    }
    context.putImageData(
      new ImageData(pixels, camera.width, camera.height),
      0,
      0,
    );
    if (camera.annotations !== false) {
      context.fillStyle = "#172337";
      context.font = "17px " + family();
      context.fillText(
        subject + " | CPU SOFTWARE DIAGNOSTIC | " + camera.name,
        18,
        26,
      );
      context.font = "13px " + family();
      context.fillText(label, 18, 49);
      const evidence: string = observation === undefined
        ? ""
        : " | pass: " + observation.stage +
          (observation.realization === "not-requested"
            ? " | realization: not requested"
            : " | mesh returned | diagnostics: " +
              (observation.diagnosticCount === null ? "unknown" : String(observation.diagnosticCount)));
      context.fillText(
        "orthographic | lines: " + lineMode + evidence,
        18,
        68,
      );
      context.fillText(
        "+X forward / +Y up / +Z anatomical left | PNG from Node Canvas2D",
        18,
        camera.height - 9,
      );
    }
    const rasterized: number = performance.now();
    const png: Buffer = canvas.toBuffer("image/png");
    return {
      png,
      milliseconds: {
        canvas: initialized - started,
        raster: rasterized - initialized,
        encode: performance.now() - rasterized,
      },
      pixels: statistics,
    };
  }

  /** Identical camera projection, flat lighting and strict z-buffer triangle order for fresh and cached reference paths. */
  function surfaces(
    camera: NodeCanvasTypes.Camera,
    meshes: readonly NodeCanvasTypes.Mesh[],
    pixels: Uint8ClampedArray,
    depth: Float64Array,
    statistics: { surface: number },
  ): void {
    const light: NodeCanvasTypes.Point = NodeCanvasCamera.unit([
      camera.back[0] + camera.up[0] + camera.right[0],
      camera.back[1] + camera.up[1] + camera.right[1],
      camera.back[2] + camera.up[2] + camera.right[2],
    ]);
    for (const mesh of meshes) {
      const projected: NodeCanvasTypes.Point[] = [];
      for (let i: number = 0; i < mesh.positions.length; i += 3)
        projected.push(
          NodeCanvasCamera.project(
            [
              mesh.positions[i]!,
              mesh.positions[i + 1]!,
              mesh.positions[i + 2]!,
            ],
            camera,
          ),
        );
      for (let i: number = 0; i < mesh.indices.length; i += 3) {
        const indices: number[] = [
          mesh.indices[i]!,
          mesh.indices[i + 1]!,
          mesh.indices[i + 2]!,
        ];
        const a: NodeCanvasTypes.Point = projected[indices[0]!]!;
        const b: NodeCanvasTypes.Point = projected[indices[1]!]!;
        const c: NodeCanvasTypes.Point = projected[indices[2]!]!;
        const world: NodeCanvasTypes.Point[] = indices.map(
          (index: number): NodeCanvasTypes.Point => [
            mesh.positions[index * 3]!,
            mesh.positions[index * 3 + 1]!,
            mesh.positions[index * 3 + 2]!,
          ],
        );
        const ab: NodeCanvasTypes.Point = [
          world[1]![0] - world[0]![0],
          world[1]![1] - world[0]![1],
          world[1]![2] - world[0]![2],
        ];
        const ac: NodeCanvasTypes.Point = [
          world[2]![0] - world[0]![0],
          world[2]![1] - world[0]![1],
          world[2]![2] - world[0]![2],
        ];
        const normal: NodeCanvasTypes.Point = NodeCanvasCamera.cross(ab, ac);
        const length: number = Math.hypot(...normal);
        if (!(length > 0)) continue;
        const facing: number =
          NodeCanvasCamera.dot(normal, camera.back) >= 0 ? 1 : -1;
        const intensity: number =
          0.28 +
          0.72 *
            Math.max(
              0,
              (facing * NodeCanvasCamera.dot(normal, light)) / length,
            );
        const channel: (value: number) => number = (value: number): number =>
          Math.round(255 * Math.pow(value * intensity, 1 / 2.2));
        const colour: NodeCanvasTypes.Point = [
          channel(mesh.colour[0]),
          channel(mesh.colour[1]),
          channel(mesh.colour[2]),
        ];
        triangle(a, b, c, colour, camera, pixels, depth, statistics);
      }
    }
  }

  /** Barycentric triangle rasterization; maximum camera depth wins without painter sorting. */
  function triangle(
    a: NodeCanvasTypes.Point,
    b: NodeCanvasTypes.Point,
    c: NodeCanvasTypes.Point,
    colour: NodeCanvasTypes.Point,
    camera: NodeCanvasTypes.Camera,
    pixels: Uint8ClampedArray,
    depth: Float64Array,
    statistics: { surface: number },
  ): void {
    const denominator: number =
      (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-12) return;
    const lowX: number = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
    const highX: number = Math.min(
      camera.width - 1,
      Math.ceil(Math.max(a[0], b[0], c[0])),
    );
    const lowY: number = Math.max(
      camera.annotations === false ? 0 : 80,
      Math.floor(Math.min(a[1], b[1], c[1])),
    );
    const highY: number = Math.min(
      camera.height - (camera.annotations === false ? 1 : 26),
      Math.ceil(Math.max(a[1], b[1], c[1])),
    );
    for (let y: number = lowY; y <= highY; y++)
      for (let x: number = lowX; x <= highX; x++) {
        const u: number =
          ((b[1] - c[1]) * (x + 0.5 - c[0]) +
            (c[0] - b[0]) * (y + 0.5 - c[1])) /
          denominator;
        const v: number =
          ((c[1] - a[1]) * (x + 0.5 - c[0]) +
            (a[0] - c[0]) * (y + 0.5 - c[1])) /
          denominator;
        const w: number = 1 - u - v;
        if (u < 0 || v < 0 || w < 0) continue;
        const z: number = u * a[2] + v * b[2] + w * c[2];
        const viewDepth: number = (camera.clipping?.distance ?? 0) - z;
        if (
          camera.clipping !== undefined &&
          (viewDepth < camera.clipping.near || viewDepth > camera.clipping.far)
        )
          continue;
        const index: number = y * camera.width + x;
        if (z <= depth[index]!) continue;
        depth[index] = z;
        pixels.set([...colour, 255], index * 4);
        statistics.surface++;
      }
  }
}
