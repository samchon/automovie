import { screenplaySceneSlug } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `screenplaySceneSlug` writes `INT. LOCATION - TIME`.
 *
 * Scenarios:
 *
 * 1. Location and time of day are upper-cased, the prefix is kept as given.
 */
export function test_unit_render_screenplay_screenplay_scene_slug(): void {
  TestValidator.equals(
    "slug",
    screenplaySceneSlug({
      interiorExterior: "INT",
      location: "Old hall",
      timeOfDay: "night",
    }),
    "INT. OLD HALL - NIGHT",
  );
}