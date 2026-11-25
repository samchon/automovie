import type { IAutoMovieSurfaceGraphicLayer } from "@automovie/interface";
import * as THREE from "three";

/** Maximum texture width or height, in pixels. */
const MAX_EDGE: number = 1024;

/** Canvas pixels per em before the texture edge limit. */
const EM: number = 96;

/**
 * Draw white glyph coverage on transparent pixels using the current browser's
 * system UI font and script fallback. The surface material supplies the
 * colour.
 *
 * Measure in a 96 px em and scale the canvas to the layer's box, with 1024 px
 * per edge at most. Break at newlines and spaces. Use the browser's ascent,
 * descent and line metrics, and refuse text that exceeds the box. The caller
 * owns the texture, which keeps the canvas's first row at the top of the face.
 *
 * Requires an OffscreenCanvas with a 2D context. Font choices and pixels depend
 * on the browser host. An explicit shot font gives the portable glyph geometry
 * path instead.
 */
export function createAutoMovieSystemTextTexture(
  faceWidth: number,
  faceDepth: number,
  layer: IAutoMovieSurfaceGraphicLayer.IText,
): THREE.CanvasTexture<OffscreenCanvas> {
  const em: number = layer.size * faceDepth;
  const width: number = (layer.width * faceWidth * EM) / em;
  const height: number = (layer.height * faceDepth * EM) / em;
  const lineHeight: number = layer.lineHeight ?? 1;
  if (
    [width, height, lineHeight].some(
      (value: number): boolean => !Number.isFinite(value) || value <= 0,
    )
  )
    throw new Error(
      "System surface text needs positive, finite box and font sizes",
    );
  if (typeof OffscreenCanvas === "undefined")
    throw new Error(
      "System surface text requires a browser with OffscreenCanvas",
    );

  const scale: number = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas: OffscreenCanvas = new OffscreenCanvas(
    Math.max(1, Math.ceil(width * scale)),
    Math.max(1, Math.ceil(height * scale)),
  );
  const context: OffscreenCanvasRenderingContext2D | null =
    canvas.getContext("2d");
  if (context === null)
    throw new Error("System surface text needs a 2D canvas context");
  context.font = `${EM}px system-ui`;
  context.textBaseline = "alphabetic";
  context.direction = "ltr";
  context.scale(canvas.width / width, canvas.height / height);

  const lines: string[] = [];
  for (const paragraph of layer.text.split("\n")) {
    const [first, ...rest]: string[] = paragraph.split(" ");
    let line: string = first!;
    if (context.measureText(line).width > width)
      throw new Error(`System text word "${line}" is wider than its box`);
    for (const word of rest) {
      const joined: string = `${line} ${word}`;
      if (context.measureText(joined).width <= width) line = joined;
      else {
        if (context.measureText(word).width > width)
          throw new Error(`System text word "${word}" is wider than its box`);
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }

  const primary: TextMetrics = context.measureText("M");
  let ascent: number = primary.fontBoundingBoxAscent;
  let descent: number = primary.fontBoundingBoxDescent;
  for (const line of lines) {
    const metrics: TextMetrics = context.measureText(line);
    ascent = Math.max(ascent, metrics.actualBoundingBoxAscent);
    descent = Math.max(descent, metrics.actualBoundingBoxDescent);
  }
  const lineSize: number = ascent + descent;
  const pitch: number = lineSize * lineHeight;
  if (lineSize + (lines.length - 1) * pitch > height)
    throw new Error(
      `System text's ${lines.length} lines are taller than its box`,
    );

  const align: "start" | "center" | "end" = layer.align ?? "start";
  context.textAlign =
    align === "start" ? "left" : align === "end" ? "right" : "center";
  const x: number = align === "start" ? 0 : align === "end" ? width : width / 2;
  context.fillStyle = "#fff";
  lines.forEach((line: string, index: number): void =>
    context.fillText(line, x, ascent + index * pitch),
  );

  // Colour glyphs such as emoji also contribute only their coverage.
  context.resetTransform();
  context.globalCompositeOperation = "source-in";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture: THREE.CanvasTexture<OffscreenCanvas> = new THREE.CanvasTexture(
    canvas,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  return texture;
}
