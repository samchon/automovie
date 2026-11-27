import { AutoMovieArchetypeRefusal } from "@automovie/archetypes";
import {
  ArchetypeTrackTime
} from "../../../../../packages/archetypes/src/core/internal/ArchetypeTrackTime";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

/**
 * A mechanism reads its prepared interval without overflowing elapsed time.
 *
 * Scenarios:
 * 1. A three-second interval starting at -2 ends at 1, and the greatest
 *    finite samples on either side hold their nearest endpoints.
 * 2. An infinite duration, an unrepresentable end and samples that cannot
 *    locate a film second refuse on the fields that own them.
 */
export function test_archetypes_internal_track_clock(): void {
  const start: number = -2;
  const duration: number = 3;
  const end: number = ArchetypeTrackTime.end("track", start, duration);
  const read = (time: number): number =>
    ArchetypeTrackTime.elapsed("track", time, start, end, duration);
  TestValidator.equals(
    "the closed interval and three elapsed times",
    [end, read(-Number.MAX_VALUE), read(-0.5), read(Number.MAX_VALUE)],
    [1, 0, 1.5, 3],
  );

  assert.throws(
    () => ArchetypeTrackTime.end("track", start, Infinity),
    (error: unknown): boolean =>
      error instanceof AutoMovieArchetypeRefusal && error.axis === "seconds",
  );
  assert.throws(
    () => ArchetypeTrackTime.end("track", 1, Number.MIN_VALUE),
    (error: unknown): boolean =>
      error instanceof AutoMovieArchetypeRefusal && error.axis === "start",
  );
  for (const sample of [NaN, -Infinity, Infinity])
    assert.throws(
      () => read(sample),
      (error: unknown): boolean =>
        error instanceof AutoMovieArchetypeRefusal && error.axis === "seconds",
    );
}
