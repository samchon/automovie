import {
  screenplaySceneSlug
} from "../../../../../packages/render/src/screenplay/internal/screenplaySceneSlug";
import { TestValidator } from "@nestia/e2e";

/**
 * `screenplaySceneSlug` writes `INT. LOCATION - TIME`.
 *
 * Scenarios:
 *
 * 1. Location and time of day are upper-cased, the prefix is kept as given.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Formats a scene heading with the authored interior/exterior prefix and uppercase location and time.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the slug formatter on a fixed scene record with mixed-case location and time.
 * @evidence contracts/development/testing.md#independent-expectations The expected literal heading pins prefix, capitalization and punctuation independently of the formatter.
 */
export function test_render_screenplay_screenplay_scene_slug(): void {
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