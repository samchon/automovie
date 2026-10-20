import { IAutoMovieFilmTimeline } from "@automovie/interface";

/**
 * The builder-owned film clock every film-effect projection reads.
 *
 * Segments map realized film frames back to shot-local source frames, and the
 * exact rational rate turns a shot-local second into the frame the engine
 * sampler will actually compare against. `fps` must equal
 * `frameRate.numerator / frameRate.denominator` when `frameRate` is present,
 * and an integer `fps` alone stands for `fps/1`; any other pair is refused as
 * invalid film-effect input.
 *
 * @evidence contracts/common.md#principled-implementation A `Pick` of the compiled timeline, so the two projections read the very fields the builder wrote; the rate pair is resolved through `resolveProductionFrameRate`, which reduces the rational by its greatest common divisor and refuses a display `fps` that differs from it.
 * @evidence contracts/common.md#clear-and-simple-design Narrows the timeline to the rate and segment list a frame projection needs, so a caller holding only a clock can ask a shot-time or interval question without inventing tracks, omissions or fingerprints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default rate is assumed: an absent `frameRate` is read as `fps/1` only when `fps` is a positive safe integer, and a fractional `fps` without its rational is refused rather than rounded.
 * @evidence contracts/common.md#meaningful-documentation States who owns the clock, what segments and the rate are used for, the consistency required between `fps` and `frameRate`, the integer `fps/1` reading, and that an inconsistent pair is refused.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type alias with no runtime code; the frame searches over it are answered on `productionFilmFrameForShotTime` and `projectProductionShotEffectFilmIntervals`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Callers pass their own compiled timeline as this clock, and neither projection caches anything keyed by it between calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Names fields of a caller-owned timeline; the projections read the segment array in place and keep no reference after returning.
 */
export type IAutoMovieFilmEffectClock = Pick<
  IAutoMovieFilmTimeline,
  "fps" | "frameRate" | "segments"
>;
