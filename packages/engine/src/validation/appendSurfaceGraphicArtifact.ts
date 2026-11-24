import type {
  IAutoMovieSurfaceGraphic,
  IAutoMovieSurfaceGraphicLayer,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { validateColor } from "./validateColor";

/**
 * Append the findings of one surface graphic at `path`: its emission, its
 * background and every layer with its face-fraction box.
 *
 * An emissive luminance must be finite and nonnegative; a background is `null`
 * or a valid linear colour. A layer box needs finite `x` and `y` of at least
 * zero, positive `width` and `height`, and `x + width` and `y + height` of at
 * most one, so every layer stays on its face. A `rect` needs a valid colour; a
 * `text` needs a font id among `context.fonts` when given, nonempty text, a
 * positive size and a valid colour. Whether an image resolves to a carried or a
 * registered project image is texture closure's check, because only it holds
 * the asset ledger.
 */
export function appendSurfaceGraphicArtifact(
  graphic: IAutoMovieSurfaceGraphic,
  path: string,
  collector: IAutoMovieViolationCollector,
  context: {
    /** Ids of the shot's font sources; absent, the font id is not resolved. */
    fonts?: ReadonlySet<string>;

    /** Ids of the scene's cameras; absent, the feed camera is not resolved. */
    cameras?: ReadonlySet<string>;

    /** The shot's own camera, which no feed may show. */
    camera?: string;
  } = {},
): void {
  if (graphic.emission.kind === "emissive")
    collector.range(
      `${path}.emission.luminance`,
      graphic.emission.luminance,
      0,
      Infinity,
      "emissive luminance (cd/m²)",
    );

  if (graphic.background !== null)
    validateColor(graphic.background, `${path}.background`, collector);

  graphic.layers.forEach(
    (layer: IAutoMovieSurfaceGraphicLayer, index: number): void => {
      const layerPath: string = `${path}.layers[${index}]`;
      appendBox(layer, layerPath, collector);
      if (layer.kind === "rect")
        validateColor(layer.color, `${layerPath}.color`, collector);
      else if (layer.kind === "text")
        appendTextLayer(layer, layerPath, context.fonts, collector);
      else if (layer.kind === "feed")
        appendFeedLayer(layer, layerPath, context, collector);
    },
  );
}

/**
 * Check one text layer's own fields: a font id the shot lists, nonempty text, a
 * positive em size in face heights, a valid colour, and an optional positive
 * line height. Whether the font maps every code point and the text fits its box
 * is the layout's check, because only the decoded font knows.
 */
function appendTextLayer(
  layer: IAutoMovieSurfaceGraphicLayer.IText,
  path: string,
  fonts: ReadonlySet<string> | undefined,
  collector: IAutoMovieViolationCollector,
): void {
  if (fonts !== undefined && !fonts.has(layer.font))
    collector.push(
      "type",
      `${path}.font`,
      "text layer font must name a font source the shot lists",
      layer.font,
    );
  if (layer.text.length === 0)
    collector.push(
      "type",
      `${path}.text`,
      "text layer text must be a nonempty string",
      layer.text,
    );
  collector.positive(`${path}.size`, layer.size, "text layer size (face heights)");
  validateColor(layer.color, `${path}.color`, collector);
  if (layer.lineHeight !== undefined)
    collector.positive(
      `${path}.lineHeight`,
      layer.lineHeight,
      "text line height",
    );
}

/**
 * Check one layer's face-fraction box: a negative corner, a nonpositive size
 * and an edge past the face's right or bottom each raise their own finding.
 */
function appendBox(
  layer: IAutoMovieSurfaceGraphicLayer.IBox,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  for (const axis of ["x", "y"] as const)
    collector.range(`${path}.${axis}`, layer[axis], 0, 1, `layer ${axis}`);
  for (const size of ["width", "height"] as const)
    collector.positive(`${path}.${size}`, layer[size], `layer ${size}`);
  for (const [corner, size] of [
    ["x", "width"],
    ["y", "height"],
  ] as const) {
    const start: number = layer[corner];
    const extent: number = layer[size];
    if (start + extent > 1)
      collector.push(
        "range",
        `${path}.${size}`,
        `layer ${corner} + ${size} must be at most 1, but was ${start + extent}`,
        extent,
      );
  }
}

/**
 * Check one feed layer: a camera the scene stages other than the shot's own,
 * and an integer height in pixels from 1 to 2048.
 */
function appendFeedLayer(
  layer: IAutoMovieSurfaceGraphicLayer.IFeed,
  path: string,
  context: { cameras?: ReadonlySet<string>; camera?: string },
  collector: IAutoMovieViolationCollector,
): void {
  if (context.cameras !== undefined && !context.cameras.has(layer.camera))
    collector.push(
      "type",
      `${path}.camera`,
      "feed camera must name a camera the scene stages",
      layer.camera,
    );
  else if (layer.camera === context.camera)
    collector.push(
      "type",
      `${path}.camera`,
      "feed camera must not be the shot's own camera",
      layer.camera,
    );
  if (
    layer.pixels < 1 ||
    layer.pixels > 2048
  )
    collector.push(
      "range",
      `${path}.pixels`,
      "feed pixels must be an integer from 1 to 2048",
      layer.pixels,
    );
}
