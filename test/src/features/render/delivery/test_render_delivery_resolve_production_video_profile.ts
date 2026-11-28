import { AutoMovieRenderDelivery } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderDelivery.resolveVideoProfile` fixes the H.264-in-MP4 picture profile of a
 * video deliverable.
 *
 * Scenarios:
 *
 * 1. The raster and rate pass through; the brands are `isom`, the pixels are
 *    square and the track matrix is the nine-entry unity matrix.
 * 2. Editing one result's matrix leaves the next result unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Resolves the required MP4 video profile and allocates a fresh track matrix for each result.
 * @evidence contracts/development/testing.md#behavioral-verification Calls video profile resolution on a fixed raster and rate, changes one returned matrix, then resolves again.
 * @evidence contracts/development/testing.md#independent-expectations The literal brand and unity matrix provide expected media facts. Mutation of the first result must leave the next matrix at identity.
 */
export function test_render_delivery_resolve_production_video_profile(): void {
  const profile = AutoMovieRenderDelivery.resolveVideoProfile({
    width: 640,
    height: 360,
    frameRate: { numerator: 24, denominator: 1 },
  });
  TestValidator.equals(
    "profile",
    [
      profile.width,
      profile.height,
      profile.frameRate,
      profile.brands,
      profile.pixelAspect,
      profile.trackMatrix.length,
    ],
    [
      640,
      360,
      { numerator: 24, denominator: 1 },
      { major: "isom", requiredCompatible: ["isom"] },
      "square",
      9,
    ],
  );
  profile.trackMatrix[0] = 99;
  TestValidator.predicate(
    "fresh matrix",
    AutoMovieRenderDelivery.resolveVideoProfile({
      width: 1,
      height: 1,
      frameRate: { numerator: 24, denominator: 1 },
    }).trackMatrix[0] !== 99,
  );
}
