import { serializeAutoMovieWebVttIdentifier } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `serializeAutoMovieWebVttIdentifier` returns an admitted identifier as is and
 * throws for one WebVTT cannot carry.
 *
 * Scenarios:
 *
 * 1. "cue-1" is returned unchanged.
 * 2. "a-->b" and "" throw.
 */
export function test_unit_render_caption_serialize_identifier(): void {
  TestValidator.equals(
    "cue-1",
    serializeAutoMovieWebVttIdentifier("cue-1"),
    "cue-1",
  );
  TestValidator.error("an arrow", (): string =>
    serializeAutoMovieWebVttIdentifier("a-->b"),
  );
  TestValidator.error("an empty identifier", (): string =>
    serializeAutoMovieWebVttIdentifier(""),
  );
}
