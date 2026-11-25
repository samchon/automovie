import { resolveProductionPngProfile } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `resolveProductionPngProfile` fixes the PNG a role must be written as.
 *
 * Scenarios:
 *
 * 1. A preview of 640 by 360 is 8-bit straight-alpha sRGB RGBA, square,
 *    upright and not interlaced.
 * 2. A preview without a size and a guide frame of zero width are refused.
 */
export function test_unit_render_delivery_resolve_production_png_profile(): void {
  TestValidator.equals(
    "preview",
    resolveProductionPngProfile({ role: "preview", width: 640, height: 360 }),
    {
      version: 1,
      role: "preview",
      width: 640,
      height: 360,
      bitDepth: 8,
      color: "rgba",
      alpha: "straight",
      interlace: "none",
      colorSpace: "srgb",
      pixelAspect: "square",
      orientation: "upright",
    },
  );
  TestValidator.error("no size", (): void => {
    resolveProductionPngProfile({ role: "preview" });
  });
  TestValidator.error("zero width", (): void => {
    resolveProductionPngProfile({ role: "guide-frame", width: 0, height: 4 });
  });
}