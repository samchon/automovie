import type { IAutoMovieViolationCollector } from "@automovie/interface";

import { isRecord } from "./isRecord";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateColor } from "./validateColor";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";

/** Ways an image layer meets its box. */
const FITS: ReadonlySet<unknown> = new Set(["contain", "cover", "stretch"]);

/**
 * Append the findings of one surface graphic at `path`: its emission, its
 * background and every layer with its face-fraction box.
 *
 * An emissive luminance must be finite and nonnegative; a background is `null`
 * or a valid linear colour. A layer box needs finite `x` and `y` of at least
 * zero, positive `width` and `height`, and `x + width` and `y + height` of at
 * most one, so every layer stays on its face. A `rect` needs a valid colour; an
 * `image` needs a nonblank asset id and a known `fit`; a `text` needs a font id
 * among `context.fonts` when given, nonempty text, a positive size and a valid
 * colour. Whether the image resolves to a carried or a registered project image
 * is texture closure's check, because only it holds the asset ledger.
 */
export function appendSurfaceGraphicArtifact(
  graphic: unknown,
  path: string,
  collector: IAutoMovieViolationCollector,
  context: {
    /**
     * Ids of the shot's font sources; absent, a text layer's font id is checked
     * for shape only.
     */
    fonts?: ReadonlySet<string>;

    /**
     * Ids of the scene's cameras; absent, a feed layer's camera is checked for
     * shape only.
     */
    cameras?: ReadonlySet<string>;

    /** The shot's own camera, which no feed may show. */
    camera?: string;
  } = {},
): void {
  if (
    !validateObjectArtifact(graphic, path, "surface graphic", collector.items)
  )
    return;

  const emission: unknown = graphic.emission;
  if (!isRecord(emission))
    collector.push(
      "type",
      `${path}.emission`,
      "emission must be an emissive or printed record",
      emission,
    );
  else if (emission.kind === "emissive")
    collector.range(
      `${path}.emission.luminance`,
      emission.luminance,
      0,
      Infinity,
      "emissive luminance (cd/m²)",
    );
  else if (emission.kind !== "printed")
    collector.push(
      "type",
      `${path}.emission.kind`,
      'emission kind must be "emissive" or "printed"',
      emission.kind,
    );

  if (graphic.background !== null)
    validateColor(graphic.background, `${path}.background`, collector);

  const layers: unknown = graphic.layers;
  if (
    !validateArrayArtifact(
      layers,
      `${path}.layers`,
      "surface graphic layers",
      collector.items,
    )
  )
    return;
  for (const [index, layer] of layers.entries()) {
    const layerPath: string = `${path}.layers[${index}]`;
    if (
      !validateObjectArtifact(
        layer,
        layerPath,
        "surface graphic layer",
        collector.items,
      )
    )
      continue;
    appendBox(layer, layerPath, collector);
    if (layer.kind === "rect")
      validateColor(layer.color, `${layerPath}.color`, collector);
    else if (layer.kind === "image") {
      validateNonEmptyId(
        layer.asset,
        `${layerPath}.asset`,
        "image layer asset",
        collector.items,
      );
      if (!FITS.has(layer.fit))
        collector.push(
          "type",
          `${layerPath}.fit`,
          'image fit must be "contain", "cover" or "stretch"',
          layer.fit,
        );
    } else if (layer.kind === "text")
      appendTextLayer(layer, layerPath, context.fonts, collector);
    else if (layer.kind === "feed")
      appendFeedLayer(layer, layerPath, context, collector);
    else
      collector.push(
        "type",
        `${layerPath}.kind`,
        'surface graphic layer kind must be "rect", "image", "text" or "feed"',
        layer.kind,
      );
  }
}

/** Line alignments a text layer accepts. */
const ALIGNS: ReadonlySet<unknown> = new Set(["start", "center", "end"]);

/**
 * Check one text layer's own fields: a font id the shot lists, nonempty text, a
 * positive em size in face heights, a valid colour, and an optional known
 * alignment and positive line height. Whether the font maps every code point
 * and the text fits its box is the layout's check, because only the decoded
 * font knows.
 */
function appendTextLayer(
  layer: Record<string, unknown>,
  path: string,
  fonts: ReadonlySet<string> | undefined,
  collector: IAutoMovieViolationCollector,
): void {
  validateNonEmptyId(
    layer.font,
    `${path}.font`,
    "text layer font",
    collector.items,
  );
  if (
    typeof layer.font === "string" &&
    fonts !== undefined &&
    !fonts.has(layer.font)
  )
    collector.push(
      "type",
      `${path}.font`,
      "text layer font must name a font source the shot lists",
      layer.font,
    );
  if (typeof layer.text !== "string" || layer.text.length === 0)
    collector.push(
      "type",
      `${path}.text`,
      "text layer text must be a nonempty string",
      layer.text,
    );
  collector.positive(
    `${path}.size`,
    typeof layer.size === "number" ? layer.size : undefined,
    "text layer size (face heights)",
  );
  validateColor(layer.color, `${path}.color`, collector);
  if (layer.align !== undefined && !ALIGNS.has(layer.align))
    collector.push(
      "type",
      `${path}.align`,
      'text align must be "start", "center" or "end"',
      layer.align,
    );
  if (layer.lineHeight !== undefined)
    collector.positive(
      `${path}.lineHeight`,
      typeof layer.lineHeight === "number" ? layer.lineHeight : undefined,
      "text line height",
    );
}

/**
 * Check one layer's face-fraction box: a negative corner, a nonpositive size
 * and an edge past the face's right or bottom each raise their own finding.
 */
function appendBox(
  layer: Record<string, unknown>,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  for (const axis of ["x", "y"] as const)
    collector.range(`${path}.${axis}`, layer[axis], 0, 1, `layer ${axis}`);
  for (const size of ["width", "height"] as const)
    collector.positive(
      `${path}.${size}`,
      typeof layer[size] === "number" ? layer[size] : undefined,
      `layer ${size}`,
    );
  for (const [corner, size] of [
    ["x", "width"],
    ["y", "height"],
  ] as const) {
    const start: unknown = layer[corner];
    const extent: unknown = layer[size];
    if (
      typeof start === "number" &&
      typeof extent === "number" &&
      Number.isFinite(start + extent) &&
      start + extent > 1
    )
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
  layer: Record<string, unknown>,
  path: string,
  context: { cameras?: ReadonlySet<string>; camera?: string },
  collector: IAutoMovieViolationCollector,
): void {
  validateNonEmptyId(
    layer.camera,
    `${path}.camera`,
    "feed camera",
    collector.items,
  );
  if (typeof layer.camera === "string") {
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
  }
  if (
    typeof layer.pixels !== "number" ||
    !Number.isSafeInteger(layer.pixels) ||
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
