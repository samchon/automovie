import { AutoMovieRenderDelivery } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderDelivery.assertPngPicture` accepts a decoded picture that has the profile.
 *
 * Scenarios:
 *
 * 1. A picture with the profile's size, depth, colour, alpha, interlace,
 *    colour space and orientation passes, with square or implicit pixels.
 * 2. A different width, an interlaced picture and a non-square explicit pixel
 *    aspect are each refused.
 */
export function test_render_delivery_assert_production_png_picture(): void {
  const profile = AutoMovieRenderDelivery.resolvePngProfile({
    role: "preview",
    width: 64,
    height: 32,
  });
  const picture = (
    patch: Partial<Parameters<typeof AutoMovieRenderDelivery.assertPngPicture>[0]["actual"]>,
  ): Parameters<typeof AutoMovieRenderDelivery.assertPngPicture>[0]["actual"] => ({
    width: 64,
    height: 32,
    bitDepth: 8,
    color: "rgba",
    alpha: "straight",
    interlace: "none",
    colorSpace: "srgb",
    pixelAspect: { kind: "square" },
    orientation: "upright",
    ...patch,
  });
  AutoMovieRenderDelivery.assertPngPicture({ profile, actual: picture({}) });
  AutoMovieRenderDelivery.assertPngPicture({
    profile,
    actual: picture({ pixelAspect: { kind: "explicit", x: 1, y: 1, unit: 0 } }),
  });
  for (const patch of [
    { width: 63 },
    { interlace: "adam7" as const },
    { pixelAspect: { kind: "explicit" as const, x: 2, y: 1, unit: 0 as const } },
  ])
    TestValidator.error(JSON.stringify(patch), (): void => {
      AutoMovieRenderDelivery.assertPngPicture({ profile, actual: picture(patch) });
    });
}
