import { ViolationCollector } from "@automovie/engine";
import { appendSurfaceGraphicArtifact } from "@automovie/engine/internal";
import type {
  IAutoMovieSurfaceGraphic,
  IAutoMovieSurfaceGraphicLayer,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A single graphic admits its luminance, layer layout, fonts and camera feed.
 *
 * Scenarios:
 *
 * 1. A text layer without a font is allowed even with an empty registry.
 * 2. A negative luminance, negative corner, nonpositive size, and rectangle
 *    overflowing the right edge point to their own fields.
 * 3. A font may neither be blank nor absent from the registry. A feed's camera
 *    must exist and differ from the shot's own view.
 */
export function test_unit_engine_validation_surface_graphic_artifact(): void {
  const collector: ViolationCollector = new ViolationCollector();
  const text: IAutoMovieSurfaceGraphicLayer.IText = {
    kind: "text",
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    text: "Ready",
    size: 0.125,
    color: { r: 1, g: 1, b: 1, a: null, hex: null },
  };
  const feed: IAutoMovieSurfaceGraphicLayer.IFeed = {
    kind: "feed",
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    camera: "side",
    pixels: 64,
  };
  const graphic: IAutoMovieSurfaceGraphic = {
    emission: { kind: "emissive", luminance: 1 },
    background: null,
    layers: [text, feed],
  };
  const context: NonNullable<
    Parameters<typeof appendSurfaceGraphicArtifact>[3]
  > = {
    fonts: new Set<string>(),
    cameras: new Set(["front", "side"]),
    camera: "front",
  };
  appendSurfaceGraphicArtifact(graphic, "graphic", collector, context);
  TestValidator.equals(
    "system text and a distinct staged feed are allowed",
    collector.items,
    [],
  );
  appendSurfaceGraphicArtifact(
    {
      ...graphic,
      emission: { kind: "emissive", luminance: -1 },
      layers: [
        { ...text, x: -0.125, height: 0, font: " " },
        { ...text, x: 0.5, font: "absent" },
        { ...feed, camera: "front" },
        { ...feed, camera: "missing", pixels: 0 },
      ],
    },
    "graphic",
    collector,
    context,
  );
  TestValidator.equals(
    "independent layer findings keep source order",
    collector.items.map(({ path }) => path),
    [
      "graphic.emission.luminance",
      "graphic.layers[0].x",
      "graphic.layers[0].height",
      "graphic.layers[0].font",
      "graphic.layers[1].width",
      "graphic.layers[1].font",
      "graphic.layers[2].camera",
      "graphic.layers[3].camera",
      "graphic.layers[3].pixels",
    ],
  );
}
